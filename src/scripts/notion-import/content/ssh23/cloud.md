::toc

---

## EC2

SSH 접속을 통해 EC2 인스턴스에 접근할 수 있습니다.

1. 제공한 private key를 복사하여 `~/.ssh` 디렉토리 내 원하시는 경로에 저장합니다.

   ```bash
   vim ~/.ssh/sparcs-hackathon
   ```

2. 위에서 생성한 파일의 권한을 600으로 변경합니다.

   ```bash
   chmod 600 ~/.ssh/sparcs-hackathon
   ```

3. 제공한 user와 public IP를 이용해 SSH 접속합니다.

   ```bash
   ssh -i <private-key> <user>@<public-ip>
   ```

## RDS

CLI 혹은 JetBrains에서 제공하는 [DataGrip](<https://www.jetbrains.com/datagrip/>) IDE 등을 통해 데이터베이스에 접근할 수 있습니다.

### CLI

**MySQL**

```bash
$ mysql -h <host> -u <user> -p
Enter password:

mysql>
```

**PostgreSQL**

```bash
$ psql -h <host> -d <database> -U <user> -W
Password:

postgres=>
```

### DataGrip

1. 좌측 상단의 ‘+’ 아이콘을 클릭한 후 신청하신 데이터베이스 종류를 선택합니다.

   ::image{src="notion-asset:a0186" alt="좌측 상단의 ‘+’ 아이콘을 클릭한 후 신청하신 데이터베이스 종류를 선택합니다."}

2. 제공한 Host, Port, User, Password, Database를 입력합니다.

   ::image{src="notion-asset:a0187" alt="제공한 Host, Port, User, Password, Database를 입력합니다."}

3. 하단의 ‘Test Connection’을 클릭하여 접속이 되는지 확인합니다.

   ::image{src="notion-asset:a0188" alt="하단의 ‘Test Connection’을 클릭하여 접속이 되는지 확인합니다."}

### DocumentDB

MongoDB shell 또는 각종 애플리케이션을 통해 DocumentDB 인스턴스에 접근할 수 있습니다.

1. DocumentDB와의 보안 연결을 위해 AWS에서 발급한 인증서가 연결하려는 장치에 저장되어 있어야 합니다. (Ubuntu 20.04 기준) 아래 명령을 사용하여 인증서를 장치에 저장합니다.

   ```bash
   wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem
   ```

2. MongoDB shell에 아래 커맨드와 같이 commandline option을 전달하여 DocumentDB에 접근할 수 있습니다.

   ```bash
   mongo --ssl --host <DB 주소 삽입>:27017 --sslCAFile rds-combined-ca-bundle.pem --username sparcs --password <암호삽입>
   ```

3. MongoDB를 사용하는 애플리케이션(MongoDB Compass, Mongoose 등)에서는 아래와 같은 connection string을 사용하여 DocumentDB에 접근할 수 있습니다.

   ```javascript
   "mongodb://sparcs:<암호삽입>@<DB 주소 삽입>:27017/?ssl=true&ssl_ca_certs=rds-combined-ca-bundle.pem&retryWrites=false"
   ```

\[**참조\]**

- SSL 인증서 저장법: 

  ::bookmark{url="https://docs.aws.amazon.com/documentdb/latest/developerguide/get-started-guide.html#cloud9-mongoshell" title="Get Started with Amazon DocumentDB" description="There are many ways to connect and get started with Amazon DocumentDB. We created this guide because we found this way to be the quickest, simplest and easiest way for users to get started using our powerful document database." image="https://docs.aws.amazon.com/images/documentdb/latest/developerguide/images/cloud9/create-environment.png" icon="https://docs.aws.amazon.com/assets/images/favicon.ico"}

- 각종 어플리케이션을 이용한 DocumentDB 인스턴스 연결법: 

  ::bookmark{url="https://docs.aws.amazon.com/documentdb/latest/developerguide/connect_programmatically.html" title="Connecting Programmatically to Amazon DocumentDB" description="This section contains code examples that demonstrate how to connect to Amazon DocumentDB (with MongoDB compatibility) using several different languages. The examples are separated into two sections based on whether you are connecting to a cluster that has Transport Layer Security (TLS) enabled or di" icon="https://docs.aws.amazon.com/assets/images/favicon.ico"}

## S3

1. [https://aws.amazon.com](<https://aws.amazon.com/>) 접속 후 우측 상단의 ‘Sign In’ 버튼을 클릭합니다.

   ::image{src="notion-asset:a0189" alt="https://aws.amazon.com 접속 후 우측 상단의 ‘Sign In’ 버튼을 클릭합니다."}

2. ‘IAM user’ 클릭 후 Account ID에 `sparcs-hackathon`을 입력합니다.

   ::image{src="notion-asset:a0190" alt="‘IAM user’ 클릭 후 Account ID에 sparcs-hackathon을 입력합니다."}

3. ‘IAM user name’과 ‘Password’에 다음을 입력합니다.

   - IAM user name: `sparcs-2023-hackathon-<팀 알파벳 소문자>`
   - Password: 제공한 비밀번호

   ::image{src="notion-asset:a0191" alt="클라우드 자원 이용 방법"}

4. 우측 상단 계정명 좌측의 Region을 Seoul로 변경합니다.

   ::image{src="notion-asset:a0192" alt="우측 상단 계정명 좌측의 Region을 Seoul로 변경합니다."}

5. Services 중 S3를 선택합니다.

   ::image{src="notion-asset:a0193" alt="Services 중 S3를 선택합니다."}

6. 팀 알파벳이 적힌 버킷을 사용할 수 있습니다.
