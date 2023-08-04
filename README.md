# capstone-project-3900h16bsyphon

## how to run
### Docker
you have the option of using docker to run the project. This is recommended.
#### Prerequisites
Follow these instructions: https://docs.docker.com/desktop/ to install docker desktop if you don't have it already. This is a bundle containing the docker daemon, docker CLI, docker compose CLI, and docker desktop client. This will be used as a way to both run the project and inspect it.

----

##### Windows
For windows machines, it is a prerequisite that you have WSL installed, with enough allocated space. If you do not have WSL, you will require about 20GB of free space to install it, and at least another 10GB to safely install Syphon.

First, click here and select your operating system:

![image](https://github.com/unsw-cse-comp3900-9900-23T2/capstone-project-3900h16bsyphon/assets/64952797/d0283425-e119-40d8-9601-0466f3597def)

then click here:

![image](https://github.com/unsw-cse-comp3900-9900-23T2/capstone-project-3900h16bsyphon/assets/64952797/df08f56c-2ef6-4123-92b0-bf4557a20343)

and follow the installer.
##### Mac
For Mac, you must simply ensure you have enough space on your machine to run docker desktop. Refer to the requirements on the [installation page](https://docs.docker.com/desktop/install/mac-install/).

Then, click here:
![image](https://github.com/unsw-cse-comp3900-9900-23T2/capstone-project-3900h16bsyphon/assets/64952797/126629e8-c8da-456d-908b-f9e742f13ab5)
To start installation. Determine if you are running on apple sillicon or intel. If your machine is from before 2019, it is using intel. If it is after, it is likely using Apple sillicon. Check your system information to determine if your processor is Intel or Apple.
##### Linux


For linux, you must be on Ubuntu, Debian, or Fadora, and should use [this link](https://docs.docker.com/desktop/install/linux-install/) to install docker. These are the distributions we also recommend. If you are on Arch, you can attempt to use the [arch installer](https://docs.docker.com/desktop/install/archlinux/) but we provide no guarantees that this will function. 
If you are on linux, you must be on an x86 architecture. Refer to the system requirements for docker for more details.

----

After this is done, ensure no other projects are running in docker. Use `docker system prune` to remove all dangling containers, images, and volumes. When you launch docker desktop, ensure that you have no images, containers, or volumes at all.

ensure that your output for the following commands match:
```
$ docker container ls
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
$ docker image ls
REPOSITORY                      TAG       IMAGE ID       CREATED        SIZE
$ docker volume ls
DRIVER    VOLUME NAME
```
If there is any other output, make sure you delete these other containers, images, and volumes before proceeding.

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
4. run `docker volume prune`, this will remove preexisting docker image volumes that you may already have from previous builds.
5. run `docker compose -f docker-compose-prod.yaml build` for a production environment. This will build the production builds of both the backend and frontend. This will pull docker containers related to rust, node, and postgres, and then copy the syphon code into it to build a full docker image with our backend and frontend. This command may take up to an hour to build depending on your depending on your internet connection and what images you may already have cached.
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

### VM
You also have the option of using a VM to run Syphon. This is not reccomended, and is intended to be a backup option if you cannot not meet the prerequisites for installing Docker.
#### Prerequisites
1. install the VM software and image by following the instructions provided on the [COMP3900 moodle page](https://moodle.telt.unsw.edu.au/mod/page/view.php?id=5727690).
2. Launch the VM software chosen, and load the COMP3900 image as defined by the guide above.
3. install postgres using `sudo apt install psql`.
4. install nvm by following the instructions [here](https://github.com/nvm-sh/nvm)
5. install cargo by following the instructions [here](https://rustup.rs/)

#### Installation
4. download the submission file.
5. unzip the submission file.
6. enter the submission file.
7. open 2 terminals in this directory.
8. to run the frontend, run:  `cd frontend; npm install && npm run build && npm start` in your first terminal.
9. in your second terminal, you should first create a syphon user, then a syphon database with the username `syphon` and password `admin`.
10. Continuing on the second terminal, you must run the migrations to set up the schemas. to do this, run `cd backend; cargo run --manifest-file ./migration/Cargo.toml -- up`
11. finally, run a production build of the backend using `cargo -r run`
