#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MainLayer } from '../lib/layer/mainLayer';
import { NRTAProps } from '../lib/nrta';
import { Utils } from '../lib/util/utils';

const app = new cdk.App();

// Recupera o nome do ambiente
let envname = app.node.tryGetContext('envname');
if (!envname) {
  console.error("****************************************************");
  console.error("ERROR: your environment name is undefined.\n");
  console.error("Please run the command like this:");
  console.error("cdk [synth|deploy|destroy] -c envname=<your environment name>");
  console.error("****************************************************");
  process.exit(1);
}

envname = envname.toUpperCase();
console.log('# Environment name:', envname);

// Inicializa as propriedades da aplicação
const initProps = new NRTAProps();
initProps.setApplicationName(envname);

// Função auxiliar para definir propriedades da aplicação com base no contexto
const setApplicationProperty = (propName: string, description: string): void => {
  const envProperty = app.node.tryGetContext(propName);
  if (envProperty) {
    console.log(`# ${description} is going to be deployed: YES`);
    initProps.addParameter(propName, true);
  } else {
    console.log(`# ${description} is going to be deployed: NO`);
  }
};

// Define propriedades opcionais com base no contexto
setApplicationProperty("deploycdn", "CloudFront");
setApplicationProperty("sessionparameter", "SSM Parameter Session");
setApplicationProperty("kinesisintegration", "Kinesis Data Streams integration");
setApplicationProperty("firehose", "Kinesis Firehose");

// Lista de regiões a serem implantadas
const regions = ['us-east-1', 'us-west-1'];
const account = process.env.CDK_DEFAULT_ACCOUNT;

Utils.checkforExistingBuckets(initProps.getBucketNames())
  .then((existingBuckets: string[]) => {
    if (existingBuckets?.length > 0) {
      console.log("# The following buckets are NOT being created because they already exist:", existingBuckets);
    }

    initProps.addParameter('existingbuckets', existingBuckets);

    // Cria uma stack para cada região
    regions.forEach(region => {
      const env: cdk.Environment = { account, region };

      // Clona as propriedades para cada região
      const regionalProps = new NRTAProps();
      regionalProps.setApplicationName(`${envname}-${region}`);
      regionalProps.copyFrom?.(initProps); // Se existir método copyFrom
      regionalProps.addParameter('existingbuckets', existingBuckets);

      new MainLayer(app, `${envname}-${region}`, regionalProps, { env });
    });
  })
  .catch((error) => {
    console.error("Erro ao verificar buckets existentes:", error);
  });
