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
          not {
            environment name: 'DEPLOYABLE_NAMES', value: ''
          }
          anyOf {
            environment name: 'ACTION', value: 'deploy'
            environment name: 'ACTION', value: 'force deploy'
          }
        }
      }
      steps {
        sh "git config --local user.email \"paul.lebedinsky@gmail.com\""
        sh "git config --local user.name \"jenkins\""
        sh "git checkout master"
        sh "git pull --rebase"
        sh "git reset --hard origin/master"
        sh "git fetch --prune origin \"+refs/tags/*:refs/tags/*\""
        sh "git fetch --tags"
        sh "yarn build"
        script {
          env.packagesToDeploy = discoverTargetsAndStartDeploy(ACTION, DEPLOYABLE_NAMES)
          echo ">>>>>> ${env.packagesToDeploy}"
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

def discoverTargetsAndStartDeploy(action, deployables = "") {
  return sh(
    script: "yarn run --silent deploy:discover -f ${action == 'force deploy'} -p ${deployables}",
    returnStdout: true
  );
}

def getDeploymentName(packagePath) {
  return sh(script: "yarn run --silent deploy:get-deployment-name ${packagePath}", returnStdout: true);
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
  jobs.failFast = true

  def parallelResults = parallel jobs

  def results = [:]
  parallelResults.each { results[it.key] = it.value.getResult() }

  return results;
}

def doPackageDeployment(packageToDeploy) {
  def buildName = sh(script: "yarn run --silent deploy:get-deployment-name ${packagePath}", returnStdout: true);
  currentBuild.displayName = "#${buildName}-${DEPLOYABLE_VERSION}-${env.GIT_COMMIT.substring(0,5)}"
  sh(script: "yarn run deploy ${packagePath}", returnStdout: true);
}
