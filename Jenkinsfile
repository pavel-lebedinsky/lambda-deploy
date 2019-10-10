pipeline {
  agent any
  tools {nodejs "nodejs-10"}
  parameters {
    string(name: 'ACTION', defaultValue:'', description: 'Deployment strategy. Supported values: "deploy", "force deploy"')
    string(name: 'PACKAGES_TO_DEPLOY', defaultValue:'', description: 'Space separated package names of packages to deploy.')
    string(name: 'PACKAGE_NAME', defaultValue:'', description: 'FOR_INTERNAL_USAGE')
  }
  stages {
    stage("Checkout branch") {
      steps {
        script {
          if (env.PACKAGE_NAME) {
            currentBuild.displayName = getBuildName(env.PACKAGE_NAME)
          }
        }
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
          not { environment name: 'PACKAGES_TO_DEPLOY', value: '' }
          anyOf {
            environment name: 'ACTION', value: 'deploy'
            environment name: 'ACTION', value: 'force deploy'
          }
        }
      }
      steps {
        sh "yarn build"
        script {
          discoverDeploymentTargetsAndDeploy(env.ACTION, env.PACKAGES_TO_DEPLOY)
        }
      }
    }

    stage("Unit Tests") {
      when {
        allOf {
          not { environment name: 'PACKAGE_NAME', value: '' }
          anyOf {
            environment name: 'ACTION', value: 'deploy'
            environment name: 'ACTION', value: 'force deploy'
          }
        }
      }
      steps {
        sh "lerna run test --scope=${PACKAGE_NAME}";
      }
    }

    stage("Deploy") {
      when {
        allOf {
          not { environment name: 'PACKAGE_NAME', value: '' }
          anyOf {
            environment name: 'ACTION', value: 'deploy'
            environment name: 'ACTION', value: 'force deploy'
          }
        }
      }
      steps {
        script {
          def config = buildConfigs[env.BRANCH_NAME]
          env.APP_ENV = config.appEnv
          env.awsCredentialsId = config.awsCredentialsId
        }

//         withCredentials([
//           string(credentialsId: 'AWS_REGION', variable: 'AWS_REGION'),
//           [
//             $class: 'AmazonWebServicesCredentialsBinding',
//             accessKeyVariable: 'AWS_ACCESS_KEY_ID',
//             credentialsId: "${buildConfigs[BRANCH_NAME].awsCredentialsId}",
//             secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
//           ]
//         ]) {
          sh '''
            yarn build
            export TEST_VAR=test-val
            export APP_ENV=${APP_ENV}
            yarn deploy ${PACKAGE_NAME}
          ''';
//         }
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

def discoverDeploymentTargetsAndDeploy(action, packagesNames = '') {
  def packagesToDeploy = sh(
    script: "yarn --silent deploy:discover -f ${action == 'force deploy'} -p ${packagesNames}",
    returnStdout: true
  )
  if (packagesToDeploy) {
    echo "Deploying: \n${packagesToDeploy}"
    if (env.BRANCH_NAME == "master") {
      // sh(script: "yarn deploy:create-version ${BRANCH_NAME}")
    }
    startPackagesDeployments(packagesToDeploy)
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
        parameters: [ string(name: 'ACTION', value: 'deploy'), string(name: 'PACKAGE_NAME', value: it) ],
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

def getBuildName(packageName) {
  def buildName = sh(script: "yarn --silent deploy:get-deployment-name ${packageName}", returnStdout: true).trim();
  return "${buildName}-${env.GIT_COMMIT.substring(0,5)}"
}
