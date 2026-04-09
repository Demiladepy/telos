#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env,
    String, Symbol, Vec,
};

#[derive(Clone)]
#[contracttype]
pub struct AgentProfile {
    pub owner: Address,
    pub pay_to: Address,
    pub endpoint: String,
    pub metadata_uri: String,
    pub updated_at_ledger: u32,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Agent(BytesN<32>),
    AgentIds,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RegistryError {
    AlreadyExists = 1,
    NotFound = 2,
    InvalidInput = 3,
}

const MAX_ENDPOINT_LEN: u32 = 512;
const MAX_METADATA_URI_LEN: u32 = 1024;
const MAX_AGENT_IDS: u32 = 10000;

#[contract]
pub struct AgentRegistryContract;

#[contractimpl]
impl AgentRegistryContract {
    /// Register a new agent id.
    pub fn register(
        env: Env,
        agent_id: BytesN<32>,
        owner: Address,
        pay_to: Address,
        endpoint: String,
        metadata_uri: String,
    ) -> Result<(), RegistryError> {
        owner.require_auth();
        Self::validate_input(&endpoint, &metadata_uri)?;

        let key = DataKey::Agent(agent_id.clone());
        if env.storage().persistent().has(&key) {
            return Err(RegistryError::AlreadyExists);
        }

        let profile = AgentProfile {
            owner: owner.clone(),
            pay_to,
            endpoint,
            metadata_uri,
            updated_at_ledger: env.ledger().sequence(),
        };

        env.storage().persistent().set(&key, &profile);
        Self::push_agent_id(&env, &agent_id)?;

        let topic: Symbol = symbol_short!("register");
        env.events().publish((topic, owner), agent_id);
        Ok(())
    }

    /// Update an existing agent profile. Only owner can update.
    pub fn update(
        env: Env,
        agent_id: BytesN<32>,
        pay_to: Address,
        endpoint: String,
        metadata_uri: String,
    ) -> Result<(), RegistryError> {
        Self::validate_input(&endpoint, &metadata_uri)?;

        let key = DataKey::Agent(agent_id.clone());
        let mut profile: AgentProfile = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(RegistryError::NotFound)?;

        profile.owner.require_auth();

        profile.pay_to = pay_to;
        profile.endpoint = endpoint;
        profile.metadata_uri = metadata_uri;
        profile.updated_at_ledger = env.ledger().sequence();

        env.storage().persistent().set(&key, &profile);

        let topic: Symbol = symbol_short!("update");
        env.events().publish((topic, profile.owner), agent_id);
        Ok(())
    }

    /// Remove an existing agent profile. Only owner can remove.
    pub fn remove(env: Env, agent_id: BytesN<32>) -> Result<(), RegistryError> {
        let key = DataKey::Agent(agent_id.clone());
        let profile: AgentProfile = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(RegistryError::NotFound)?;

        profile.owner.require_auth();
        env.storage().persistent().remove(&key);
        Self::remove_agent_id(&env, &agent_id);

        let topic: Symbol = symbol_short!("remove");
        env.events().publish((topic, profile.owner), agent_id);
        Ok(())
    }

    /// Get a profile for a specific agent id.
    pub fn get(env: Env, agent_id: BytesN<32>) -> Option<AgentProfile> {
        env.storage().persistent().get(&DataKey::Agent(agent_id))
    }

    /// List registered agent ids (simple index for explorers/clients).
    pub fn list_ids(env: Env) -> Vec<BytesN<32>> {
        env.storage()
            .persistent()
            .get(&DataKey::AgentIds)
            .unwrap_or(Vec::new(&env))
    }

    fn validate_input(endpoint: &String, metadata_uri: &String) -> Result<(), RegistryError> {
        if endpoint.len() == 0 || endpoint.len() > MAX_ENDPOINT_LEN {
            return Err(RegistryError::InvalidInput);
        }
        if metadata_uri.len() > MAX_METADATA_URI_LEN {
            return Err(RegistryError::InvalidInput);
        }
        Ok(())
    }

    fn push_agent_id(env: &Env, agent_id: &BytesN<32>) -> Result<(), RegistryError> {
        let mut ids: Vec<BytesN<32>> = env
            .storage()
            .persistent()
            .get(&DataKey::AgentIds)
            .unwrap_or(Vec::new(env));

        if ids.len() >= MAX_AGENT_IDS {
            return Err(RegistryError::InvalidInput);
        }

        ids.push_back(agent_id.clone());
        env.storage().persistent().set(&DataKey::AgentIds, &ids);
        Ok(())
    }

    fn remove_agent_id(env: &Env, agent_id: &BytesN<32>) {
        let ids: Vec<BytesN<32>> = env
            .storage()
            .persistent()
            .get(&DataKey::AgentIds)
            .unwrap_or(Vec::new(env));

        let mut next = Vec::new(env);
        for id in ids.iter() {
            if id != *agent_id {
                next.push_back(id);
            }
        }
        env.storage().persistent().set(&DataKey::AgentIds, &next);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, BytesN};

    fn id(env: &Env, n: u8) -> BytesN<32> {
        BytesN::from_array(env, &[n; 32])
    }

    #[test]
    fn register_get_update_remove_flow() {
        let env = Env::default();
        let contract_id = env.register(AgentRegistryContract, ());
        let client = AgentRegistryContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let pay_to = Address::generate(&env);
        let agent_id = id(&env, 7);

        let endpoint = String::from_str(&env, "https://agent.example/api");
        let metadata = String::from_str(&env, "ipfs://bafy-agent");

        client.register(&agent_id, &owner, &pay_to, &endpoint, &metadata);

        let stored = client.get(&agent_id).unwrap();
        assert_eq!(stored.owner, owner);
        assert_eq!(stored.pay_to, pay_to);
        assert_eq!(stored.endpoint, endpoint);
        assert_eq!(stored.metadata_uri, metadata);

        let pay_to_2 = Address::generate(&env);
        let endpoint_2 = String::from_str(&env, "https://agent.example/v2");
        let metadata_2 = String::from_str(&env, "ipfs://bafy-agent-v2");
        client.update(&agent_id, &pay_to_2, &endpoint_2, &metadata_2);

        let updated = client.get(&agent_id).unwrap();
        assert_eq!(updated.pay_to, pay_to_2);
        assert_eq!(updated.endpoint, endpoint_2);
        assert_eq!(updated.metadata_uri, metadata_2);

        let ids = client.list_ids();
        assert_eq!(ids.len(), 1);
        assert_eq!(ids.get(0).unwrap(), agent_id);

        client.remove(&agent_id);
        assert!(client.get(&agent_id).is_none());
        assert_eq!(client.list_ids().len(), 0);
    }
}

