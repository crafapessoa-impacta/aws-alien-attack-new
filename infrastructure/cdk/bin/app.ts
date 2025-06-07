#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AlienAttackStack } from '../lib/alien-attack-stack';

const app = new cdk.App();

// Região principal
new AlienAttackStack(app, 'AlienAttackStack-Primary', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
});

// Região secundária (ativo-ativo)
new AlienAttackStack(app, 'AlienAttackStack-Secondary', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-west-1' },
});
