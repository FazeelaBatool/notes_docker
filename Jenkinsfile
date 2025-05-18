pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = "notes_ci"
        COMPOSE_FILE = "docker-compose.ci.yml"
    }

    stages {
        stage('Clone Repo') {
            steps {
                git branch: 'main', url: 'https://github.com/FazeelaBatool/notes_docker.git'
            }
        }

        stage('Build and Run Docker') {
            steps {
                script {
                    sh 'docker --version || exit 1'
                    sh 'docker-compose -p $COMPOSE_PROJECT_NAME -f $COMPOSE_FILE up --build -d'
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up Docker containers...'
            script {
                sh 'docker-compose -p $COMPOSE_PROJECT_NAME -f $COMPOSE_FILE down || true'
                sh 'docker system prune -f || true'
                sh 'docker volume prune -f || true'
            }
        }
    }
}
