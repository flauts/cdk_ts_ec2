import {
  Stack,
  StackProps,
  aws_ec2 as ec2,
  aws_iam as iam,
  CfnOutput,
  DefaultStackSynthesizer,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export class CdkEc2Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    const synthesizer = new DefaultStackSynthesizer({
      fileAssetsBucketName: "cf-templates-iw9mos24h2jo-us-east-1",
      bucketPrefix: "",
      cloudFormationExecutionRole: "arn:aws:iam::172067734210:role/LabRole",
      deployRoleArn: "arn:aws:iam::172067734210:role/LabRole",
      fileAssetPublishingRoleArn: "arn:aws:iam::172067734210:role/LabRole",
      deployRoleExternalId: "arn:aws:iam::172067734210:role/LabRole",
      imageAssetPublishingRoleArn: "arn:aws:iam::172067734210:role/LabRole",
    });

    super(scope, id, { ...props, synthesizer });

    const vpc = ec2.Vpc.fromLookup(this, "vpc", {
      vpcId: "vpc-00efc54137e6a9ef2",
    });

    const secGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      "launch-wizard-1",
      "sg-0c77723568ab75889"
    );

    const keyPair = ec2.KeyPair.fromKeyPairName(
      this,
      "ExistingKeyPair",
      "vockey"
    );

    const labRole = iam.Role.fromRoleArn(
      this,
      "LabRole",
      "arn:aws:iam::172067734210:role/LabRole"
    );

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      "git clone https://github.com/flauts/webplantilla.git /var/www/html/webplantilla",
      "git clone https://github.com/flauts/websimple.git /var/www/html/websimple"
    );

    const instance = new ec2.Instance(this, "mv-cdk", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.genericLinux({
        "us-east-1": "ami-0aa28dab1f2852040",
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: secGroup,
      keyPair,
      userData,
      role: labRole,
    });

    new CfnOutput(this, "InstanceIdOutput", {
      value: instance.instanceId,
      exportName: "InstanceId",
    });
    new CfnOutput(this, "InstancePublicIPOutput", {
      value: instance.instancePublicIp || "No public IP assigned",
      exportName: "InstancePublicIP",
    });
    new CfnOutput(this, "WebsimpleURLOutput", {
      value: `http://${instance.instancePublicIp}/websimple`,
      exportName: "WebsimpleURL",
    });
    new CfnOutput(this, "WebPlantillaURLOutput", {
      value: `http://${instance.instancePublicIp}/webplantilla`,
      exportName: "WebplantillaURL",
    });
  }
}
