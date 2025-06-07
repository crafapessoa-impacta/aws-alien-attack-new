#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from 'aws-cdk-lib';
import { MainLayer } from '../lib/layer/mainLayer';
import { NRTAProps } from '../lib/nrta';
import { Utils } from '../lib/util/utils';

const app = new cdk.App();

// Recupera o nome do ambiente
let envname = app.node.tryGetContext('envname');
if (!envname) {
    console.log("****************************************************");
    console.log("ERROR: your environment name is undefined.\n");
    console.log("Please run the command like this:");
    console.log("cdk [synth|deploy|destroy] -c envname=<your environment name>");
    console.log("****************************************************");
    process.exit(1);
}
iza as propriedades da aplicação
const initProps = new NRTAProps();
initProps.setApplicationName(envname);

// Função auxiliar para definir propriedades da aplicação com base no contexto
const setApplicationProperty = (propName: string, description: string): void => {
    YES`);
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
    .then((listOfExistingBuckets) => {
        if (listOfExistingBuckets && listOfExistingBuckets.length > 0) {
            console.log("# The following buckets are NOT being created because they already exist:", listOfExistingBuckets);
        }
        initProps.addParameter('existingbuckets', listOfExistingBuckets);

        // Cria uma stack para cada região
        regions.forEach(region => {
            const env = { account, region };
            const regionalProps = new NRTAProps();

            // Copia os parâmetros do initProps
            regionalProps.setApplicationName(`${envname}-${region}`);
            regionalProps.copyFrom?.(initProps); // Se existir método copyFrom
            regionalProps.addParameter('existingbuckets', listOfExistingBuckets);

            new MainLayer(app, `${envname}-${region}`, regionalProps, { env });
        });
    })
    .catch((errorList) => {
        console.log(errorList);
    });
