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
                    // Show docker versions
                    sh 'docker --version'
                    sh 'docker-compose --version'

                    // Stop and remove any existing containers to ensure clean start
                    sh "docker-compose -p $COMPOSE_PROJECT_NAME -f $COMPOSE_FILE down -v --remove-orphans || true"

                    // Build and run the container in detached mode
                    sh "docker-compose -p $COMPOSE_PROJECT_NAME -f $COMPOSE_FILE up --build -d"
                }
            }
        }

        stage('Show Container Logs') {
            steps {
                sh "docker logs notes_app_ci || true"
            }
        }

        stage('Verify Application Running') {
            steps {
                script {
                    echo "Checking if app is reachable at http://localhost:9090"
                    retry(5) {
                        sh '''
                        curl --fail http://localhost:9090 || (
                            echo "App not reachable yet, waiting 10 seconds..."
                            sleep 10
                            exit 1
                        )
                        '''
                    }
                }
            }
        }
    }
}
