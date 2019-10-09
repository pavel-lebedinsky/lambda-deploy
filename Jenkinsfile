pipeline {
  agent any
  tools {nodejs "nodejs-10"}
  parameters {
    string(name: 'ACTION', defaultValue:'', description: 'Deployment strategy. Supported values: "test", "deploy", "force deploy"')
    string(name: 'DEPLOYABLE_NAMES', defaultValue:'', description: 'Space separated package names of units to deploy.')
    string(name: 'PATH_TO_DEPLOY', defaultValue:'', description: 'FOR_INTERNAL_USAGE')
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
          not { environment name: 'DEPLOYABLE_NAMES', value: '' }
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
          def packagesToDeploy = discoverTargetsAndStartDeploy(env.ACTION, env.DEPLOYABLE_NAMES)
          if (packagesToDeploy) {
            echo "Deploying: \n${packagesToDeploy}"
            startPackagesDeployments(env.packagesToDeploy);
          } else {
            echo "Nothing to deploy."
          }
        }
      }
    }

    stage("Deploy to dev") {
      when {
        allOf {
          branch 'dev'
          not { environment name: 'PATH_TO_DEPLOY', value: '' }
          anyOf {
            environment name: 'ACTION', value: 'deploy'
            environment name: 'ACTION', value: 'force deploy'
          }
        }
      }
      steps {
        script {
          setBuildName(env.PATH_TO_DEPLOY)
        }
        sh '''
          export TEST_VAR=test-val
          yarn run deploy ${env.PATH_TO_DEPLOY}
        ''';

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
        job: env.JOB_NAME,
        parameters: [ string(name: 'ACTION', value: 'deploy'), string(name: 'PATH_TO_DEPLOY', value: it) ],
        propagate: false
      )
    }
  }
  jobs.failFast = true
  def parallelResults = parallel jobs

  def results = [:]
  parallelResults.each { results[it.key] = it.value.getResult() }

  return results;
}

def setBuildName(packagePath) {
  def buildName = sh(script: "yarn run --silent deploy:get-deployment-name ${packagePath}", returnStdout: true).trim();
  currentBuild.displayName = "#${buildName}-${env.GIT_COMMIT.substring(0,5)}"
}
