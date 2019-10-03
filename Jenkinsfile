pipeline {
  agent any
  tools {nodejs "nodejs-10"}
  parameters {
    string(name: 'ACTION', defaultValue:'', description: 'Deployment strategy. Supported values: "test", "deploy", "force deploy"')
    string(name: 'DEPLOYABLE_NAMES', defaultValue:'', description: 'Names of units to deploy.')
    string(name: 'TO_DEPLOY', defaultValue:'', description: 'FOR_INTERNAL_USAGE')
  }
  stages {
    stage("Pushed tags") {
      // fixme: this function doesn't work in declaritive pipeline
      // (JENKINS-55987) will need to use alternative method to detect
      // tags. Lowest priority. The intent for this stage was analytics.

      // when { buildingTag() }
      // steps {
      //   echo "Git tags pushed."
      //   echo "Nothing to do here.."
      // }

      steps {
        echo ">>>>>>>>>>>>>>>>>>>  ${params}"
      }
    }

    stage("Unit tests") {
      when { environment name: 'ACTION', value: 'test' }
      steps {
        echo ">>>>>>>>>>>>>>>>>>>  ${params}"
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
        sh "git fetch --tags"
        sh "yarn build"
        getChanges("${ACTION}", "${DEPLOYABLE_NAMES}")
  
        // Capture list of changed packages (lerna changed)
        // If BRANCH_NAME == 'prod', version repo (lerna version)
        // For each changed package...
        /*
        build job: "${JOB_NAME}", parameters: [
          string(name: 'DEPLOYABLE_NAMES', value: "foo")  // "foo" should be dynamic
          ]
        */  
      }
    }

    stage("Deploy") {
      when {
        allOf {
          environment name: 'ACTION', value: 'deploy'
          not { environment name: 'TO_DEPLOY', value: '' }
        }
      }
      steps {
        performDeployment()
        // Install dependencies (lerna bootstrap)
        // Run tests (lerna run test --scope=${TO_DEPLOY})
        // Inject configuration
        // Run deployment (lerna run deploy --scope=${TO_DEPLOY})
      }
    }
  }
}

import groovy.json.JsonSlurper

def getChanges(action, deployables = "") {  
  echo "Detecting packages for '${action}' action to appy to ${deployables ? deployables : "all"} packages..."
  
  def packakesToDeploy = [];
  def requestedPackagesNames = deployables.split(',').collect {it.trim()} as Set
  def packages = getAllPackages();
  if (action == "force deploy") {
    echo "Forced deployment detected..."
    packakesToDeploy = requestedPackagesNames.empty
      ? packages
      : packages.findAll {it.key in requestedPackagesNames }
  } else {
    def changedPackagesPaths = getChangedPackages()
    packakesToDeploy = requestedPackagesNames.empty 
      ? packages.findAll {it.value in changedPackagesPaths }
      : packages.findAll {it.key in requestedPackagesNames && it.value in changedPackagesPaths}
  }

  runDeployment(packakesToDeploy)
}

def getAllPackages() {
  echo "Calling getPackagesPaths()..."
  def packagesFileName = "packages-${currentBuild.id}.log"
  sh "lerna exec -- pwd > ${packagesFileName}"
  def paths = readFile(packagesFileName).trim().split('\n');
  return paths.collectEntries {
    [(it.split("/").last()) : it]
  }
}

def getChangedPackages() {
  echo "Detecting changed packages..."
  def changesFileName = "changes-${currentBuild.id}.json"
  def changedPackagesPaths = [] as Set;
  try {
    sh "lerna changed -a -p > ${changesFileName}"
    changedPackagesPaths = readFile(changesFileName).trim().split('\n') as Set
  } catch(Exception e) {
    echo "No changes detected."
  }
  return changedPackagesPaths;
}

def getPackageJson(packagePath) {
  def packageJson = readFile("${packagePath}/package.json");
  def jsonSlurper = new JsonSlurper()
  return jsonSlurper.parseText(packageJson);
}

def runDeployment(packagesMap) {
  echo "Running deployment..."
  echo "${packagesMap}"

  def jobs = [:]
  packagesMap.each {
    jobs[it.key] = { 
      build(
        job: "${JOB_NAME}",
        parameters: [
          string(name: 'ACTION', value: 'deploy'),
          string(name: 'DEPLOYABLE_NAMES', value: ''),
          string(name: 'TO_DEPLOY', value: it.value)
        ]
      )  
    }
  }
  jobs.failFast = true
  parallel jobs
}

def performDeployment() {
  def packageJson = getPackageJson(params.TO_DEPLOY)
  if (!packageJson.deploy) {
    throw new Exception("Not deployable package can not be deployed: ${params.TO_DEPLOY}")
  }
  DEPLOYABLE_VERSION=packageJson.version
  currentBuild.displayName = "#${packageJson.deploy.serviceName}-${DEPLOYABLE_VERSION}-${env.GIT_COMMIT.substring(0,5)}"
  // TODO: If Fetcher name doesn't actualy exist (runtime user error?) then fail build right away.
}
