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
                    // Display versions
                    sh 'docker --version'
                    sh 'docker-compose --version'

                    // Clean up previous containers
                    sh "docker-compose -p $COMPOSE_PROJECT_NAME -f $COMPOSE_FILE down -v --remove-orphans || true"

                    // Build and run detached
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
                        if ! curl --fail http://localhost:9090; then
                            echo "App not reachable yet, waiting 10 seconds..."
                            sleep 10
                            exit 1
                        fi
                        '''
                    }
                }
            }
        }
    }

    post {
        failure {
            echo "Pipeline failed. Check logs above for details."
        }
        success {
            echo "✅ App built and is running after webhook trigger."
        }
    }
}
