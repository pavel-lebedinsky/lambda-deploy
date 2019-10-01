pipeline {
  agent any
  parameters {
    string(name: 'FETCHER_NAME', defaultValue:'', description: 'Name of targeted fetcher to deploy.')
  }
  stages {
    stage("Pushed tags") {
      // fixme: this function doesn't work in declaritive pipeline
      // (JENKINS-55987) will need to use alternative method to detect
      // tags. Lowest priority. The intent for this stage was analytics.
      when { buildingTag() }
      steps {
        echo "🏷 Git tags pushed."
        echo "Nothing to do here.."
      }
    }

    stage("Discover Targets") {
      when { environment name: 'FETCHER_NAME', value: '' }  // and add  noGitTags() condition
      steps {
        echo "TODO: discover targets"
        // Capture list of changed packages (lerna changed)
        // If BRANCH_NAME == 'prod', version repo (lerna version)
        // For each changed package...
        /*
        build job: "${JOB_NAME}", parameters: [
          string(name: 'FETCHER_NAME', value: "foo")  // "foo" should be dynamic
          ]
        */
      }
    }

    /*
    stage("Deploy Fetcher") {
      when {
        not { environment name: 'FETCHER_NAME', value: '' }
      }
      steps {
        script {
          FETCHER_VERSION='X.X.X' // scrape version from it's package.json?
          currentBuild.displayName = "#${params.FETCHER_NAME}-${FETCHER_VERSION}-${env.GIT_COMMIT}" // but just 5 characters
          // TODO: If Fetcher name doesn't actualy exist (runtime user error?) then fail build right away.
        }
        // Install dependencies (lerna bootstrap)
        // Run tests (lerna run test --scope=${FETCHER_NAME})
        // Inject configuration
        // Run deployment (lerna run deploy --scope=${FETCHER_NAME})
      }
    }
    */
  }
}
