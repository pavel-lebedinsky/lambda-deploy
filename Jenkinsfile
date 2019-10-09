pipeline {
  agent any
  tools {nodejs "nodejs-10"}
  parameters {
    string(name: 'ACTION', defaultValue:'', description: 'Deployment strategy. Supported values: "test", "deploy", "force deploy"')
    string(name: 'DEPLOYABLE_NAMES', defaultValue:'', description: 'Names of units to deploy.')
    string(name: 'TO_DEPLOY', defaultValue:'', description: 'FOR_INTERNAL_USAGE')
  }
  stages {
    stage("Unit tests") {
      when { environment name: 'ACTION', value: 'test' }
      steps {
        sh "yarn build"
        sh "yarn test"
      }
    }

    stage("Discover Targets") {
      when { 
        allOf {
          environment name: 'TO_DEPLOY', value: ''
          anyOf {
            environment name: 'ACTION', value: 'deploy'
            environment name: 'ACTION', value: 'force deploy'
          }
        }
      }
      steps {
        sh "git config --local user.email \"paul.lebedinsky@gmail.com\""
        sh "git config --local user.name \"jenkins\""
        sh "git reset --hard origin/master"
        sh "git fetch --prune origin \"+refs/tags/*:refs/tags/*\""
        sh "git fetch --tags"
        sh "git checkout master"
        sh "yarn build"
        script {
          env.packagesToDeploy = discoverTargetsAndStartDeploy(ACTION, DEPLOYABLE_NAMES)
        }
      }
    }

    stage("Deploy") {
      when {
        anyOf {
          environment name: 'ACTION', value: 'deploy'
          environment name: 'ACTION', value: 'force deploy'
        }
      }
      steps {
        script {
          if (TO_DEPLOY) {
            env.deploymentResult = doPackageDeployment(TO_DEPLOY)
          } else if (env.packagesToDeploy) {
            env.deploymentResult = startPackagesDeployments(env.packagesToDeploy);
          } else {
            echo "Nothing to deploy."
          }
        }
      }
    }

    stage("Done") {
      steps {
        echo "Job done: ${env.deploymentResults}"
      }
    }
  }
}

def signature = 'new groovy.json.JsonSlurperClassic'
org.jenkinsci.plugins.scriptsecurity.scripts.ScriptApproval.get().approveSignature(signature)

import groovy.json.JsonSlurperClassic

ACTION_TEST = "test";
ACTION_DEPLOY = "deploy";
ACTION_FORCE_DEPLOY = "force deploy";

def discoverTargetsAndStartDeploy(action, deployables = "") {
  return sh(
    script: "yarn run deploy:discover -f ${action == ACTION_FORCE_DEPLOY} -p ${deployables}",
    returnStdout: true
  );
}

def startPackagesDeployments(packagesToDeploy) {
  echo "Starting deployments..."
  echo "${packagesToDeploy}"

  def jobs = [:]
  packagesToDeploy.split("\n").collect {
      jobs[it] = {
        build(
          job: "${JOB_NAME}",
          parameters: [
            string(name: 'ACTION', value: 'deploy'),
            string(name: 'DEPLOYABLE_NAMES', value: ''),
            string(name: 'TO_DEPLOY', value: it)
          ],
          propagate: false,
          wait: true
        )  
      } 
    }
  }
  jobs.failFast = true

  def parallelResults = parallel jobs

  def results = [:]
  parallelResults.each { results[it.key] = it.value.getResult() }

  return results;
}

def doPackageDeployment(packageToDeploy) {
  //def packageJson = getPackageJson(packageToDeploy)
  if (!packageJson.deploy) {
    throw new Exception("Not deployable package can not be deployed: ${params.TO_DEPLOY}")
  }
  DEPLOYABLE_VERSION= "0.0.0" // packageJson.version
  currentBuild.displayName = "#${packageJson.deploy.serviceName}-${DEPLOYABLE_VERSION}-${env.GIT_COMMIT.substring(0,5)}"
  sh "lerna run test --scope=${packageJson.name}"
  sh "lerna run deploy --scope=${packageJson.name}"
}
