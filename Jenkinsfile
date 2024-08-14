pipeline {
  agent any

  stages {
    stage('Build') {
      steps {
        sh 'cd backend && npm install'
        sh 'cd backend && npm run build'
      }
    }
    stage('Test') {
      steps {
        sh 'cd backend && npm test'
      }
    }
    stage('Deploy') {
      steps {
        sh 'echo "Deploying..."'
        // actual deployment steps 
      }
    }
  }
}