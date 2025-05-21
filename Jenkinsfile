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
                    // Check Docker and docker-compose versions
                    sh 'docker --version || exit 1'
                    sh 'docker-compose --version || exit 1'

                    // Bring down previous containers to avoid conflicts
                    sh "docker-compose -p $COMPOSE_PROJECT_NAME -f $COMPOSE_FILE down -v --remove-orphans || true"

                    // Build and run containers in detached mode
                    sh "docker-compose -p $COMPOSE_PROJECT_NAME -f $COMPOSE_FILE up --build -d"
                }
            }
        }

        stage('Verify Application Running') {
            steps {
                script {
                    // Retry curl up to 5 times with 10 seconds delay to check if app is running on port 9090
                    retry(5) {
                        sh 'curl --fail http://localhost:9090 || (echo "Waiting for app to start..." && sleep 10 && exit 1)'
                    }
                }
            }
        }
    }
}
