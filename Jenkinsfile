pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = "notes_ci"
        COMPOSE_FILE = "docker-compose.ci.yml"
    }

    stages {
        stage('Clone Repo') {
            steps {
                git 'https://github.com/FazeelaBatool/notes_docker.git'
            }
        }

        stage('Build and Run Docker') {
            steps {
                script {
                    // Check if Docker is installed
                    sh 'docker --version || exit 1'

                    // Build and run containers
                    sh 'docker-compose -p $COMPOSE_PROJECT_NAME -f $COMPOSE_FILE up --build -d'
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up Docker containers...'
            script {
                // Stop and remove containers
                sh 'docker-compose -p $COMPOSE_PROJECT_NAME -f $COMPOSE_FILE down || true'

                // Remove unused images and containers
                sh 'docker system prune -f || true'
                sh 'docker volume prune -f || true'
            }
        }
    }
}
