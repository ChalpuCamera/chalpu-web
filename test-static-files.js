import https from "https";
import http from "http";

// 테스트할 URL (개발 서버 기준)
const BASE_URL = "http://localhost:3001";

// 테스트할 정적 파일 경로들
const staticPaths = [
  "/_next/static/css/app/globals.css",
  "/_next/static/chunks/webpack.js",
  "/_next/static/chunks/main.js",
  "/favicon.ico",
];

function testStaticFile(path) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${path}`;
    const client = url.startsWith("https") ? https : http;

    const req = client.get(url, (res) => {
      console.log(`\n📁 ${path}`);
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Content-Type: ${res.headers["content-type"]}`);
      console.log(`   Cache-Control: ${res.headers["cache-control"]}`);
      console.log(
        `   Access-Control-Allow-Origin: ${res.headers["access-control-allow-origin"]}`
      );

      if (res.statusCode === 200) {
        console.log(`   ✅ 정상 응답`);
      } else if (res.statusCode === 302) {
        console.log(`   ⚠️  리다이렉트 발생`);
      } else {
        console.log(`   ❌ 오류 응답`);
      }

      resolve();
    });

    req.on("error", (err) => {
      console.log(`\n📁 ${path}`);
      console.log(`   ❌ 요청 실패: ${err.message}`);
      resolve();
    });

    req.setTimeout(5000, () => {
      console.log(`\n📁 ${path}`);
      console.log(`   ⏰ 타임아웃`);
      req.destroy();
      resolve();
    });
  });
}

async function runTests() {
  console.log("🔍 정적 파일 MIME 타입 테스트 시작...\n");
  console.log(`📍 테스트 서버: ${BASE_URL}`);
  console.log("=" * 50);

  for (const path of staticPaths) {
    await testStaticFile(path);
  }

  console.log("\n" + "=" * 50);
  console.log("✅ 테스트 완료");
}

// 서버가 실행 중인지 확인
const checkServer = () => {
  return new Promise((resolve) => {
    const req = http.get(BASE_URL, () => {
      resolve(true);
    });

    req.on("error", () => {
      resolve(false);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
};

async function main() {
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.log("❌ 개발 서버가 실행되지 않았습니다.");
    console.log("   npm run dev 명령어로 서버를 시작한 후 다시 실행해주세요.");
    return;
  }

  await runTests();
}

main().catch(console.error);
