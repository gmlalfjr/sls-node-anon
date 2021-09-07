import httpError from 'http-errors';

import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
const pem = jwkToPem({
  "alg": "RS256",
  "e": "AQAB",
  "kid": "EdIXDzhDrVG3VmJ0lHyWgCLrJZNhDkopEdTaqCXwohE=",
  "kty": "RSA",
  "n": "pSvy5IsevrZhtw_CTFAaacuJpGQMgNrWHWqRMV02T3dlXfzh1_xhnQO1uYg1PK74beEPBbfjmFU7F5kHAIp_Mm2EjyOmlIYTx-J3qyXqUOFQnRLsRb-Cgstq6D-b58FN9FutOhBJWVilwqhMiN_LWXHEd0-JgXnjQKZoG2NU_Lo6ZmUfw65qOLPLZWdF_lE3hZ8-F2aOAXnrsZc76uPXdnnGPBbB9JZ2V-EdGNIUnd_e7l-GzSIMlujnvv6VuGkmM5HgJwTfMkLG1N9ge85K8qh_qHbdDF53MZ1eKSJPGfFdbg1ptKOXtyDOPcz088Tbu35CniCQLrKpfdDxwx4uwQ",
  "use": "sig"
  });

const _generatePolicy = (principalId, effect, resource, username = null) => {
  // const { sub: principalId } = decoded;
  const apiGatewayWildcard = resource.split('/', 2).join('/') + '/*';
  const authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {};
    policyDocument.Version = '2012-10-17';
    policyDocument.Statement = [];
    const statementOne = {};
    statementOne.Action = 'execute-api:Invoke';
    statementOne.Effect = effect;
    statementOne.Resource = '*';
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  if (username) {
    authResponse.context = {
      "username": username,
    };
  }

  if(effect.toLowerCase() === 'deny'){
    console.log('KENA DENY COY');
    authResponse.context = {
      "Message": "Token Expired boss" ,
    };
  }

  console.log(authResponse, 'LOG AUTH RESPONSE');
  return authResponse;
};

const auth = async (event, context, callback) => {
  const tokenParts = event.authorizationToken
  if (!tokenParts) {
    console.log('GET UNAUTHORIZED');
    throw new Error("Unauthorized");
  }

  

  try {
    const bearer = tokenParts.split(' ')
    const tokenValue = bearer[1];
    const decoded = jwt.verify(tokenValue, pem, { algorithms: ['RS256'] });
    console.log('DECODED', decoded);
    return callback(null, _generatePolicy(decoded.sub, 'Allow', event.methodArn, decoded['cognito:username']))
  } catch (error) {
    console.log(error, 'LOG ERRORNYA');
    return callback(null, _generatePolicy('user', 'Deny', event.methodArn))
    // throw new httpError.Forbidden('Forbidden error')
  }

}


export const handler = auth