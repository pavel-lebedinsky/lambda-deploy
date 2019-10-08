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

def discoverTargetsAndStartDeploy(action, deployables = "") {
  echo "Detecting packages for '${action}' action to appy to ${deployables ? deployables : "all"} packages..."
  
  def packagesToDeploy = [];
  def requestedPackagesNames = deployables.split(',').collect {it.trim()} as Set
  def packages = getAllPackages();
  
  if (action == "force deploy") {
    echo "Forced deployment detected..."
    packagesToDeploy = requestedPackagesNames.empty
      ? packages
      : packages.findAll {it.key in requestedPackagesNames }
  } else {
    def changedPackagesPaths = getChangedPackages()
    packagesToDeploy = requestedPackagesNames.empty 
      ? packages.findAll {it.value in changedPackagesPaths }
      : packages.findAll {it.key in requestedPackagesNames && it.value in changedPackagesPaths}
    sh "lerna version patch --yes"  
  }

  return packagesToDeploy.values().join(",");
}

def getAllPackages() {
  echo "Calling getPackagesPaths()..."
  def packagesFileName = "packages-${currentBuild.id}.log"
  sh "lerna exec -- pwd > ${packagesFileName}"
  def paths = readFile(packagesFileName).trim().split('\n');
  return paths.collectEntries { [(it.split("/").last()) : it] }
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
  def jsonSlurper = new JsonSlurperClassic()
  return jsonSlurper.parseText(packageJson);
}

def startPackagesDeployments(packagesToDeploy) {
  echo "Starting deployments..."
  echo "${packagesToDeploy}"

  def jobs = [:]
  packagesToDeploy.split(",").collect {
    def packageJson = getPackageJson(it)
    if (packageJson.deploy) {
      jobs[packageJson.name] = {
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
  parallelResults.each {
    results[it.key] = it.value.getResult()
  }

  return results;
}

def doPackageDeployment(packageToDeploy) {
  def packageJson = getPackageJson(packageToDeploy)
  if (!packageJson.deploy) {
    throw new Exception("Not deployable package can not be deployed: ${params.TO_DEPLOY}")
  }
  DEPLOYABLE_VERSION=packageJson.version
  currentBuild.displayName = "#${packageJson.deploy.serviceName}-${DEPLOYABLE_VERSION}-${env.GIT_COMMIT.substring(0,5)}"
  sh "lerna run test --scope=${packageJson.name}"
  sh "lerna run deploy --scope=${packageJson.name}"
}
