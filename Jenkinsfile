pipeline {
  agent any
  tools {nodejs "nodejs-10"}
  parameters {
    string(name: 'ACTION', defaultValue:'', description: 'Deployment strategy. Supported values: "deploy", "force deploy"')
    string(name: 'DEPLOYABLE_NAMES', defaultValue:'', description: 'Space separated package names of units to deploy.')
    string(name: 'PATH_TO_DEPLOY', defaultValue:'', description: 'FOR_INTERNAL_USAGE')
  }
  stages {
    stage("Checkout branch") {
      steps {
        sh "git config --local user.email \"paul.lebedinsky@gmail.com\""
        sh "git config --local user.name \"jenkins\""
        sh "git checkout ${BRANCH_NAME}"
        sh "git reset --hard origin/${BRANCH_NAME}"
        sh "git fetch --prune origin \"+refs/tags/*:refs/tags/*\""
        sh "git pull --rebase"
        sh "git fetch --tags"
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
        sh "yarn build"
        script {
          discoverDeploymentTargetsAndDeploy(env.ACTION, env.DEPLOYABLE_NAMES)
        }
      }
    }

    stage("Deploy") {
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
          currentBuild.displayName = getBuildName(env.PATH_TO_DEPLOY)
        }
        withCredentials([
          string(credentialsId: 'AWS_REGION', variable: 'AWS_REGION'),
          [
            $class: 'AmazonWebServicesCredentialsBinding',
            accessKeyVariable: 'AWS_ACCESS_KEY_ID',
            credentialsId: "${buildConfigs[BRANCH_NAME].awsCredentialsId}",
            secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
          ]
        ]) {
          sh '''
            yarn build
            export TEST_VAR=test-val
            export APP_ENV=${buildConfigs[BRANCH_NAME].appEnv}
            yarn deploy ${PATH_TO_DEPLOY}
          ''';
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

buildConfigs = [
  dev: [
    awsCredentialsId: "jenkins-fbcd-dcgvideo-devqa",
    appEnv: "dev"
  ],
  qa: [
    awsCredentialsId: "jenkins-fbcd-dcgvideo-devqa",
    appEnv: "qa"
  ],
  master: [
    awsCredentialsId: "jenkins-fbcd-dcgvideo-stage",
    appEnv: "prod"
  ]
];

def discoverDeploymentTargetsAndDeploy(action, deployables = '') {
  def packagesToDeploy = sh(
    script: "yarn --silent deploy:discover -f ${action == 'force deploy'} -p ${deployables}",
    returnStdout: true
  )
  if (packagesToDeploy) {
    echo "Deploying: \n${packagesToDeploy}"
    if (env.BRANCH_NAME == "master") {
      // sh(script: "yarn deploy:create-version ${BRANCH_NAME}")
    }
    startPackagesDeployments(packagesToDeploy);
  } else {
    echo "Nothing to deploy."
  }
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

def getBuildName(packagePath) {
  def buildName = sh(script: "yarn --silent deploy:get-deployment-name ${packagePath}", returnStdout: true).trim();
  return "#${buildName}-${env.GIT_COMMIT.substring(0,5)}"
}
