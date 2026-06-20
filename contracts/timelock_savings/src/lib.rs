//! Time-locked savings vault for Soroban.
//!
//! Users lock their own tokens until a future timestamp, then withdraw
//! once the lock period has matured. Supports multiple savings goals per user.

#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env,
};

const MAX_SAVINGS_PER_USER: u32 = 20;

#[contracterror]
#[derive(Copy, Clone, Eq, PartialEq, Debug)]
pub enum Error {
    InvalidAmount = 1,
    InvalidUnlockTime = 2,
    SavingsNotFound = 3,
    StillLocked = 4,
    AlreadyWithdrawn = 5,
    MaxSavingsReached = 6,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Count(Address),
    Savings(Address, u32),
}

#[derive(Clone, Debug)]
#[contracttype]
pub struct SavingsGoal {
    pub token: Address,
    pub amount: i128,
    pub unlock_at: u64,
    pub withdrawn: bool,
}

#[contract]
pub struct TimelockSavings;

#[contractimpl]
impl TimelockSavings {
    /// Lock tokens until `unlock_at` (unix timestamp in seconds).
    /// Returns the savings goal ID for this user.
    pub fn lock(
        env: Env,
        saver: Address,
        token: Address,
        amount: i128,
        unlock_at: u64,
    ) -> Result<u32, Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let now = env.ledger().timestamp();
        if unlock_at <= now {
            return Err(Error::InvalidUnlockTime);
        }

        saver.require_auth();

        let count_key = DataKey::Count(saver.clone());
        let count: u32 = env.storage().persistent().get(&count_key).unwrap_or(0);
        if count >= MAX_SAVINGS_PER_USER {
            return Err(Error::MaxSavingsReached);
        }

        let goal_id = count;
        let goal = SavingsGoal {
            token: token.clone(),
            amount,
            unlock_at,
            withdrawn: false,
        };

        token::Client::new(&env, &token).transfer(
            &saver,
            &env.current_contract_address(),
            &amount,
        );

        env.storage()
            .persistent()
            .set(&DataKey::Savings(saver.clone(), goal_id), &goal);
        env.storage()
            .persistent()
            .set(&count_key, &(count + 1));

        env.events().publish(
            (symbol_short!("locked"), saver.clone(), goal_id),
            (amount, unlock_at),
        );

        Ok(goal_id)
    }

    /// Withdraw tokens from a matured savings goal back to the saver.
    pub fn withdraw(env: Env, saver: Address, goal_id: u32) -> Result<i128, Error> {
        saver.require_auth();

        let key = DataKey::Savings(saver.clone(), goal_id);
        let mut goal: SavingsGoal = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::SavingsNotFound)?;

        if goal.withdrawn {
            return Err(Error::AlreadyWithdrawn);
        }

        if env.ledger().timestamp() < goal.unlock_at {
            return Err(Error::StillLocked);
        }

        goal.withdrawn = true;
        env.storage().persistent().set(&key, &goal);

        token::Client::new(&env, &goal.token).transfer(
            &env.current_contract_address(),
            &saver,
            &goal.amount,
        );

        env.events().publish(
            (symbol_short!("withdraw"), saver.clone(), goal_id),
            goal.amount,
        );

        Ok(goal.amount)
    }

    /// Read a savings goal by ID.
    pub fn get_goal(env: Env, saver: Address, goal_id: u32) -> Result<SavingsGoal, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Savings(saver, goal_id))
            .ok_or(Error::SavingsNotFound)
    }

    /// Return how many savings goals a user has created.
    pub fn get_count(env: Env, saver: Address) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::Count(saver))
            .unwrap_or(0)
    }

    /// Check whether a goal has matured and is ready to withdraw.
    pub fn is_unlocked(env: Env, saver: Address, goal_id: u32) -> Result<bool, Error> {
        let goal = Self::get_goal(env.clone(), saver, goal_id)?;
        Ok(!goal.withdrawn && env.ledger().timestamp() >= goal.unlock_at)
    }
}

mod test;
