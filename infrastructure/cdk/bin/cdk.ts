#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import cdk = require('aws-cdk-lib');

import { MainLayer } from '../lib/layer/mainLayer';
import { NRTAProps } from '../lib/nrta';
import { Utils } from '../lib/util/utils';

const app = new cdk.App();
let envname = app.node.tryGetContext('envname');
if (!envname) {
    console.log("****************************************************");
    console.log("ERROR: your environment name is undefined.\n");
    console.log("Please run the command like this:");
    console.log("cdk [synth|deploy|destroy] -c envname=<your environment name>");
    console.log("****************************************************");
    process.exit(1);
}
else envname=envname.toUpperCase();
console.log('# Environment name:',envname);

const regions = ['us-east-1', 'us-west-1'];

for (const region of regions) {
    const props = new NRTAProps({
        env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: region
        }
    });

    props.setApplicationName(`${envname}-${region.split('-').join('')}`);
    props.addParameter('sessionparameter', true);
    props.addParameter('kinesisintegration', true);
    props.addParameter('firehose', true);
    props.addParameter('deploycdn', true);

    Utils.checkforExistingBuckets(props.getBucketNames())
        .then((listOfExistingBuckets) => {
            if (listOfExistingBuckets && listOfExistingBuckets.length > 0)
                console.log("# The following buckets are NOT being created because they already exist: ", listOfExistingBuckets);
            props.addParameter('existingbuckets', listOfExistingBuckets);
            new MainLayer(app, props.getApplicationName(), props);
        })
        .catch((errorList) => {
            console.log(errorList);
        });
}
