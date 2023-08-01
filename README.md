# capstone-project-3900h16bsyphon

## how to run
### Docker
you have the option of using docker to run the project. This is recommended.
#### Prerequisites
Follow these instructions: https://docs.docker.com/desktop/ to install docker if you don't have it already. This will give you docker desktop, which is bundled with both the docker and docker compose CLIs. This will be used as a way to both run the project and inspect it.

TODO: Copy instructions for installing docker

#### Installation
1. Unzip the submission file.
2. Enter the unzipped file: `cd capstone-project-3900h16bsyphon`
3. ensure docker is installed and open. Use `docker ps` to check. The output should be:
```
peedee@PeterLaptop:~$ docker ps
CONTAINER ID   IMAGE             COMMAND                  CREATED      STATUS        PORTS                     NAMES
```
if you see output like:
```
peedee@PeterLaptop:~$ docker ps
-bash: /usr/bin/docker: No such file or directory
```
or
```
Cannot connect to the Docker daemon at unix:///Users/aishanauman/.docker/run/docker.sock. Is the docker daemon running?
```
or some other output mentioning how docker is not installed or running. If this happens, this means that docker desktop is not running. Ensure it is running and live by making sure you see this screen on docker desktop:
![image](https://github.com/unsw-cse-comp3900-9900-23T2/capstone-project-3900h16bsyphon/assets/64952797/1a976ce3-7490-4a9a-a6cd-db6b86f499fe)
4. run `docker compose -f docker-compose-prod.yaml build` for a prod environment. This will build the production builds of both the backend and frontend. This will pull docker containers related to rust, node, and postgres, and then copy the syphon code into it to build a full docker image with our backend and frontend. This command may take up to an hour to build depending on your depending on your internet connection and what images you may already have cached.
Here is the output that will occur when you do this:
```
aishanauman~/Desktop/capstone-project-3900h16bsyphon % docker compose -f docker-compose-prod.yaml build
[+] Building 45.4s (17/40)                                                                                                                                                                            
 => [frontend_prod internal] load build definition from prod.Dockerfile                                                                                                                          0.1s
 => => transferring dockerfile: 389B                                                                                                                                                             0.0s
 => [frontend_prod internal] load .dockerignore                                                                                                                                                  0.1s
 => => transferring context: 59B                                                                                                                                                                 0.0s
 => [backend_prod internal] load build definition from prod.Dockerfile                                                                                                                           0.0s
 => => transferring dockerfile: 970B                                                                                                                                                             0.0s
 => [backend_prod internal] load .dockerignore                                                                                                                                                   0.0s
 => => transferring context: 64B                                                                                                                                                                 0.0s
 => [frontend_prod internal] load metadata for docker.io/library/node:lts-alpine                                                                                                                 1.5s
 => [backend_prod internal] load metadata for docker.io/library/debian:buster                                                                                                                    3.5s
 => [backend_prod internal] load metadata for docker.io/library/rust:1.70.0-buster                                                                                                               3.1s
 => [frontend_prod builder 1/6] FROM docker.io/library/node:lts-alpine@sha256:93d91deea65c9a0475507e8bc8b1917d6278522322f00c00b3ab09cab6830060                                                   0.0s
 => [frontend_prod internal] load build context                                                                                                                                                  0.1s
 => => transferring context: 11.37kB                                                                                                                                                             0.0s
 => CACHED [frontend_prod builder 2/6] WORKDIR /app                                                                                                                                              0.0s
 => [frontend_prod builder 3/6] COPY package.json package-lock.json ./                                                                                                                           0.3s
 => [frontend_prod builder 4/6] RUN npm ci                                                                                                                                                      37.9s
 => [backend_prod internal] load build context                                                                                                                                                   0.0s
 => => transferring context: 3.31kB                                                                                                                                                              0.0s
 => [backend_prod stage-3 1/7] FROM docker.io/library/debian:buster@sha256:c21dbb23d41cb3f1c1a7f841e8642bf713934fb4dc5187979bd46f0b4b488616                                                     19.6s
 => => resolve docker.io/library/debian:buster@sha256:c21dbb23d41cb3f1c1a7f841e8642bf713934fb4dc5187979bd46f0b4b488616                                                                           0.0s
 => => sha256:3b830c5d210077d297956550caedf93430d5779fd786b4ac8e22a6bfe54ff162 529B / 529B                                                                                                       0.0s
 => => sha256:9eabbca4bbf36f9c778ae052a9e6796cda58ca5b714378fb81d78703b6abdda2 1.48kB / 1.48kB                                                                                                   0.0s
 => => sha256:5e2555ae6edde2e7933c533234cb224b6d7ef3a3c90041851e31fe29ab7197c9 49.24MB / 49.24MB                                                                                                14.2s
 => => sha256:c21dbb23d41cb3f1c1a7f841e8642bf713934fb4dc5187979bd46f0b4b488616 984B / 984B                                                                                                       0.0s
 => => extracting sha256:5e2555ae6edde2e7933c533234cb224b6d7ef3a3c90041851e31fe29ab7197c9                                                                                                       27.4s
 => [backend_prod chef 1/3] FROM docker.io/library/rust:1.70.0-buster@sha256:7aaaba642f8053f897e4221f4dc4d7e6f1839e0ef0a166c995048c3991cc33ac                                                   41.8s
 => => resolve docker.io/library/rust:1.70.0-buster@sha256:7aaaba642f8053f897e4221f4dc4d7e6f1839e0ef0a166c995048c3991cc33ac                                                                      0.0s
 => => sha256:7aaaba642f8053f897e4221f4dc4d7e6f1839e0ef0a166c995048c3991cc33ac 988B / 988B                                                                                                       0.0s
 => => sha256:9c843be39a7ce6a31931c628070f917bedf8e93d50f36c7de69698ae28bffbb4 1.38kB / 1.38kB                                                                                                   0.0s
 => => sha256:a2be394f4a77ff0a93180bdcff1d10ab875ba4fd1e80c415d3e49c136c733b6c 6.11kB / 6.11kB                                                                                                   0.0s
 => => sha256:5e2555ae6edde2e7933c533234cb224b6d7ef3a3c90041851e31fe29ab7197c9 49.24MB / 49.24MB                                                                                                14.2s
 => => sha256:503bef164a5c225a74d09ad3b129d3bff71bea2ad1fb291b63c6d342493b62ba 17.45MB / 17.45MB                                                                                                 2.8s
 => => sha256:b3816d11f9d5d9a3bb643dd5c7291e610012ec9eef9c769ce5f6107abdf1eb6d 52.22MB / 52.22MB                                                                                                 9.4s
 => => sha256:456c8535b3af918c9b8d87c98c4d7bc631d833d1ebb4d816aefbf356372983c6 183.47MB / 183.47MB                                                                                              41.8s
 => => sha256:2c0dd52509814612f378e3b7e359be40cca2719d9cf61f3ce462b18a57f8734c 243.80MB / 243.80MB                                                                                              28.5s
 => => extracting sha256:5e2555ae6edde2e7933c533234cb224b6d7ef3a3c90041851e31fe29ab7197c9                                                                                                        4.7s
 => => extracting sha256:503bef164a5c225a74d09ad3b129d3bff71bea2ad1fb291b63c6d342493b62ba                                                                                                        1.8s
 => => extracting sha256:b3816d11f9d5d9a3bb643dd5c7291e610012ec9eef9c769ce5f6107abdf1eb6d                                                                                                        7.7s
 => => extracting sha256:456c8535b3af918c9b8d87c98c4d7bc631d833d1ebb4d816aefbf356372983c6                                                                                                       12.0s
 => [backend_prod stage-3 2/7] RUN apt-get update && apt install -y openssl                                                                                                                     10.5s
 => [backend_prod stage-3 3/7] WORKDIR /app                                                                                                                                                      0.0s
 => [frontend_prod builder 5/6] COPY . .                                                                                                                                                         0.2s 
 => [frontend_prod builder 6/6] RUN npm run build                                                                                                                                                5.4s 
 => => # info  - Loaded env from /app/.env                                                                                                                                                            
 => => # Attention: Next.js now collects completely anonymous telemetry regarding usage.                                                                                                              
 => => # This information is used to shape Next.js' roadmap and prioritize features.                                                                                                                  
 => => # You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:                                                      
 => => # https://nextjs.org/telemetry                                                                                                                                                                
 => => # info  - Linting and checking validity of types...                                                                                                                                           
```
5. run `docker volume prune`, this will remove preexisting image volumes.

6. run `docker compose -f docker-compose-prod.yaml up`. This will launch the set of images you just pulled and built. This will, in a couple of seconds, launch the frontend and backend, with a database. Wait until you see the backend has successfully launched, and the frontend has successfully launched. inspect your docker output to see that this output:
![image](https://github.com/unsw-cse-comp3900-9900-23T2/capstone-project-3900h16bsyphon/assets/64952797/19517e0a-a37a-4f66-805f-83d73b2fefbb)
Can be seen (backend).
Also, the frontend should be launched, with output which looks like:
![image](https://github.com/unsw-cse-comp3900-9900-23T2/capstone-project-3900h16bsyphon/assets/64952797/4eb17ea0-eccc-485c-b479-9edcd390d8d4)

After you validate that this output has been given, you should navigate to http://localhost:3000, and you should see syphon's home page:
![image](https://github.com/unsw-cse-comp3900-9900-23T2/capstone-project-3900h16bsyphon/assets/64952797/97b9dca6-ed56-4b0c-b4c8-84f3c4549bcf)


Caveats:

Make sure the ports **8000, 15432, and 3000** are currently unused on your computer. These are exposed to allow
for the project to be exposed. If they are in use, one of a few things are going to happen:


1. 8000 is used:

backend will say something like
```
ADDR already in use
```
then crash.

2. 3000 is used:

frontend will say something that is **not**
```
running on localhost:3000
```
this will likely lead to cors errors.

3. 15432 is used:


This often occurs if you installed postgres before and forgot to delete it after you stopped using it. 
the database you connect to will NOT have syphon data in it, and instead be the one connected on that port. 
it may say something like "cannot find database 'syphon'" or "user 'syphon' does not exist"
Requests to the database will not cause logging to your docker container.

## local
first, ensure that systemfd and cargo-watch are installed:
```
cargo install systemfd
cargo install cargo-watch
```
in one terminal, run "cd backend; bash run_backend.sh"
in another, run "cd frontend; npm install; npm run dev"
