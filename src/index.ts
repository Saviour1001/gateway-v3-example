import axios from "axios";
import { ethers } from "ethers";
import { createHash } from "crypto";
import canonicalize from "canonicalize";
import { readFileSync, writeFileSync } from "fs";
import { configDotenv } from "dotenv";

configDotenv();
const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY as string);
const didName = "billy";

let headersList = {
  Accept: "*/*",
  "x-api-key": process.env.API_KEY,
  "Content-Type": "application/json",
};

async function getSignedNonce(): Promise<string> {
  let createUserNonceMutation = {
    query: `mutation($wallet: String!, $name: String!) {
    createUserNonce(input: {         
        signingKey: $wallet,
        did: $name      
    })
}`,
    variables: { wallet: wallet.address, name: didName },
  };

  let bodyContent = JSON.stringify(createUserNonceMutation);

  let reqOptions = {
    url: "https://v3-dev.protocol.mygateway.xyz/graphql",
    method: "POST",
    headers: headersList,
    data: bodyContent,
  };

  let response = await axios.request(reqOptions);

  const nonce = response.data.data.createUserNonce;
  console.log(nonce);
  const signature = await wallet.signMessage(nonce);

  console.log(signature);
  return signature;
}

async function createUser(signature: string) {
  let createUserMutation = {
    query: `mutation($wallet: String!, $signature: String!) {
    createUser(
        signature: $signature,
        signingKey: $wallet
        
    )
}`,
    variables: { wallet: wallet.address, signature },
  };

  let bodyContent = JSON.stringify(createUserMutation);

  let reqOptions = {
    url: "https://v3-dev.protocol.mygateway.xyz/graphql",
    method: "POST",
    headers: headersList,
    data: bodyContent,
  };

  let response = await axios.request(reqOptions);

  console.log(response.data);

  writeFileSync("src/token.json", JSON.stringify(response.data));
}

async function loginUser(signature: string) {
  let loginUserMutation = {
    query: `mutation($wallet: String!, $signature: String!, $did: String!) {
    loginUser(
        signature: $signature,
        signingKey: $wallet,
        did: $did
    )
}`,
    variables: { wallet: wallet.address, signature, did: didName },
  };

  let bodyContent = JSON.stringify(loginUserMutation);

  let reqOptions = {
    url: "https://v3-dev.protocol.mygateway.xyz/graphql",
    method: "POST",
    headers: headersList,
    data: bodyContent,
  };

  let response = await axios.request(reqOptions);

  console.log(response.data);

  writeFileSync("src/token.json", JSON.stringify(response.data));
}

async function checkUserNameAvailability() {
  let checkUsernameAvailabilityQuery = {
    query: `query CheckUsernameAvailability($username: String!) {
  checkUsernameAvailability(username: $username)
}`,
    variables: { username: didName },
  };

  let bodyContent = JSON.stringify(checkUsernameAvailabilityQuery);

  let reqOptions = {
    url: "https://v3-dev.protocol.mygateway.xyz/graphql",
    method: "POST",
    headers: headersList,
    data: bodyContent,
  };

  let response = await axios.request(reqOptions);

  console.log(response.data);
}

export const jsonEncoder = (object: any) => {
  return createHash("sha256")
    .update(canonicalize(object) as string)
    .digest("hex");
};

async function createPDAWithoutDataModel() {
  const pdaData = {
    title: "Gateway Team",
    description:
      "Given to people that have had contributed to the beginning of Gateway",
    owner: {
      type: "USER_DID",
      value: "billy",
    },
    claim: {
      name: "test",
    },
    tags: ["test"],
  };

  const pdaDataHash = jsonEncoder(pdaData);

  console.log(pdaDataHash);

  let dataSignature = await wallet.signMessage(pdaDataHash);

  const data = readFileSync("./token.json");
  const token = JSON.parse(data.toString()).data.loginUser;
  console.log("token", token);

  console.log(wallet.address);
  console.log(dataSignature);

  const newHeadersList = {
    Accept: "*/*",
    "x-api-key": "f9p_9z3V3WZfv3IT_fnFTSXBxlAmhhz-",
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  };

  let createPDAWithoutDataModelMutation = {
    query: `mutation($wallet: String!, $signature: String!) {
      createPDA(
      input: {
      signingKey: $wallet,
      signature: $signature,
      data: {
      title: "Gateway Team",
      description: "Given to people that have had contributed to the beginning of Gateway",
      owner: {
      type: USER_DID,
      value: "billy"
      },
      claim: {
      name: "test"
      },
      tags
      : [
      "test"
      ]
      }
      }
      ){
      id
      }
  }`,
    variables: {
      wallet: wallet.address,
      signature: dataSignature,
      pdaData: pdaData,
    },
  };

  let bodyContent = JSON.stringify(createPDAWithoutDataModelMutation);

  let reqOptions = {
    url: "https://v3-dev.protocol.mygateway.xyz/graphql",
    method: "POST",
    headers: newHeadersList,
    data: bodyContent,
  };

  let response = await axios.request(reqOptions);

  console.log(response.data);
}

async function checkUser() {
  let checkUserQuery = {
    query: `query user {
    user(input: {
        type: USER_DID,
        value: "billy"
    }) {
        id
        encryptionKey
    }
}`,
  };

  let bodyContent = JSON.stringify(checkUserQuery);

  let reqOptions = {
    url: "https://v3-dev.protocol.mygateway.xyz/graphql",
    method: "POST",
    headers: headersList,
    data: bodyContent,
  };

  let response = await axios.request(reqOptions);

  console.log(response.data);
}

async function main() {
  const signature = await getSignedNonce();
  // await createUser(signature);
  // await loginUser(signature);
  // await checkUserNameAvailability();
  // await createPDAWithoutDataModel();

  // await checkUser();
}

main();
