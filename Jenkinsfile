pipeline {
  agent any
  tools {nodejs "nodejs-10"}
  parameters {
    choice(name: 'ACTION', choices: ['test', 'deploy', 'force deploy'], description: 'Deployment strategy')
    string(name: 'DEPLOYABLE_NAMES', defaultValue:'network-status-fetcher, configuration', description: 'Names of units to deploy.')
    string(name: 'TO_DEPLOY', defaultValue:'', description: 'FOR_INTERNAL_USAGE')
  }
  stages {
    stage("Pushed tags") {
      // fixme: this function doesn't work in declaritive pipeline
      // (JENKINS-55987) will need to use alternative method to detect
      // tags. Lowest priority. The intent for this stage was analytics.

      when { buildingTag() }
      steps {
        echo "Git tags pushed."
        echo "Nothing to do here.."
      }
    }

    stage("Unit tests") {
      steps {
        sh "yarn build"
        sh "yarn test"
      }
    }

    stage("Discover Targets") {
      when { 
        allOf {
          environment name: 'TO_DEPLOY', value: ''  // and add  noGitTags() condition
          anyOf {
            environment name: 'ACTION', value: 'deploy'
            environment name: 'ACTION', value: 'force deploy'
          }
        }
      }
      steps {
        sh "git fetch --tags"
        getChanges("${DEPLOYABLE_NAMES}")
  
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

    /*
    stage("Deploy") {
      when {
        not { environment name: 'TO_DEPLOY', value: '' }
      }
      steps {
        script {
          DEPLOYABLE_VERSION='X.X.X' // scrape version from it's package.json?
          currentBuild.displayName = "#${params.TO_DEPLOY}-${DEPLOYABLE_VERSION}-${env.GIT_COMMIT}" // but just 5 characters
          // TODO: If Fetcher name doesn't actualy exist (runtime user error?) then fail build right away.
        }
        // Install dependencies (lerna bootstrap)
        // Run tests (lerna run test --scope=${TO_DEPLOY})
        // Inject configuration
        // Run deployment (lerna run deploy --scope=${TO_DEPLOY})
      }
    }
    */
  }
}

def getChanges(deployables) {  
  echo "Calling getChanges()...  with param ${deployables}"
  def changesFileName = "changes-${currentBuild.id}.json"
  try {
    sh "lerna changed -a --ndjson > ${changesFileName}"
    def output=readFile(changesFileName).trim().split('\n')
    echo "output=${output}"
  } catch(Exception e) {
    echo "No changes detected."
  }
  
  echo "output=${getPackagesPaths()}"
}

def getPackagesPaths() {
  echo "Calling getPackagesPaths()..."
  def packagesFileName = "packages-${currentBuild.id}.log"
  sh "lerna exec -- pwd > ${packagesFileName}"
  return readFile(packagesFileName).trim().split('\n');
}
