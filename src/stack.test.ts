import { expect as expectCDK, haveResource, haveResourceLike, arrayWith, objectLike, stringLike } from '@aws-cdk/assert'
import { App, Stack } from '@aws-cdk/core'
import { LoadBalancerStack } from './stack'

describe('LoadBalancerStack', () => {
  let testApp: App
  let testStack: Stack

  beforeEach(() => {
    testApp = new App()
    testStack = new LoadBalancerStack(testApp, 'Loadbalancer')
  })

  it('should use the correct instance type', () => {
    expectCDK(testStack).to(haveResource('AWS::AutoScaling::LaunchConfiguration', {
      InstanceType: 't3a.micro'
    }))
  })

  it('have the required outbound ports open', () => {
    expectCDK(testStack).to(haveResource('AWS::EC2::SecurityGroupEgress', {
      ToPort: 80
    }))
    expectCDK(testStack).to(haveResource('AWS::EC2::SecurityGroupEgress', {
      ToPort: 5432
    }))
    expectCDK(testStack).to(haveResource('AWS::EC2::SecurityGroupEgress', {
      ToPort: 6379
    }))
    expectCDK(testStack).to(haveResource('AWS::EC2::SecurityGroupEgress', {
      ToPort: 12001
    }))
  })

  it('should autoscale on CPU load', () => {
    expectCDK(testStack).to(haveResource('AWS::AutoScaling::ScalingPolicy', {
      TargetTrackingConfiguration: {
        PredefinedMetricSpecification: {
          PredefinedMetricType: 'ASGAverageCPUUtilization'
        },
        TargetValue: 40
      }
    }))
  })

  it('should have an IAM role to read from s3', () => {
    expectCDK(testStack).to(haveResourceLike('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: arrayWith(objectLike({
          Action: 's3:GetObject',
          Resource: 'arn:aws:s3:::cdk-alb-test/*',
        }))
      }
    }))
  })

  it('should have a userdata script', () => {
    expectCDK(testStack).to(haveResource('AWS::AutoScaling::LaunchConfiguration', {
      UserData: {
        "Fn::Base64": stringLike('*/testFile.txt*')
      }
    }))
  })
})