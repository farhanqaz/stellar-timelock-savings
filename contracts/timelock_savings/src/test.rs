#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, testutils::Ledger, token, Address, Env};

fn create_token<'a>(
    e: &Env,
    admin: &Address,
) -> (token::Client<'a>, token::StellarAssetClient<'a>) {
    let sac = e.register_stellar_asset_contract_v2(admin.clone());
    (
        token::Client::new(e, &sac.address()),
        token::StellarAssetClient::new(e, &sac.address()),
    )
}

fn create_contract(e: &Env) -> TimelockSavingsClient<'_> {
    let contract_id = e.register(TimelockSavings, ());
    TimelockSavingsClient::new(e, &contract_id)
}

fn set_timestamp(e: &Env, timestamp: u64) {
    e.ledger().with_mut(|li| {
        li.timestamp = timestamp;
    });
}

#[test]
fn lock_and_withdraw_after_maturity() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let saver = Address::generate(&e);
    let (token, token_admin) = create_token(&e, &admin);
    let contract = create_contract(&e);

    token_admin.mint(&saver, &1_000);
    set_timestamp(&e, 1_000);

    let unlock_at = 2_000;
    let goal_id = contract.lock(&saver, &token.address, &500, &unlock_at);

    assert_eq!(goal_id, 0);
    assert_eq!(token.balance(&saver), 500);
    assert_eq!(token.balance(&contract.address), 500);
    assert_eq!(contract.get_count(&saver), 1);

    let goal = contract.get_goal(&saver, &goal_id);
    assert_eq!(goal.amount, 500);
    assert_eq!(goal.unlock_at, unlock_at);
    assert!(!goal.withdrawn);
    assert!(!contract.is_unlocked(&saver, &goal_id));

    set_timestamp(&e, unlock_at);
    assert!(contract.is_unlocked(&saver, &goal_id));

    let withdrawn = contract.withdraw(&saver, &goal_id);
    assert_eq!(withdrawn, 500);
    assert_eq!(token.balance(&saver), 1_000);
    assert_eq!(token.balance(&contract.address), 0);

    let goal = contract.get_goal(&saver, &goal_id);
    assert!(goal.withdrawn);
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn withdraw_before_unlock_fails() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let saver = Address::generate(&e);
    let (token, token_admin) = create_token(&e, &admin);
    let contract = create_contract(&e);

    token_admin.mint(&saver, &1_000);
    set_timestamp(&e, 1_000);

    let goal_id = contract.lock(&saver, &token.address, &300, &5_000);

    set_timestamp(&e, 2_000);
    contract.withdraw(&saver, &goal_id);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn lock_with_past_unlock_time_fails() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let saver = Address::generate(&e);
    let (token, _) = create_token(&e, &admin);
    let contract = create_contract(&e);

    set_timestamp(&e, 10_000);
    contract.lock(&saver, &token.address, &100, &9_000);
}

#[test]
fn multiple_savings_goals_per_user() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let saver = Address::generate(&e);
    let (token, token_admin) = create_token(&e, &admin);
    let contract = create_contract(&e);

    token_admin.mint(&saver, &2_000);
    set_timestamp(&e, 100);

    let goal_a = contract.lock(&saver, &token.address, &400, &1_000);
    let goal_b = contract.lock(&saver, &token.address, &600, &2_000);

    assert_eq!(goal_a, 0);
    assert_eq!(goal_b, 1);
    assert_eq!(contract.get_count(&saver), 2);
    assert_eq!(token.balance(&contract.address), 1_000);

    set_timestamp(&e, 1_000);
    contract.withdraw(&saver, &goal_a);
    assert_eq!(token.balance(&saver), 1_400);

    set_timestamp(&e, 2_000);
    contract.withdraw(&saver, &goal_b);
    assert_eq!(token.balance(&saver), 2_000);
}
