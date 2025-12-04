# 배포 가이드

## Cloudflare Pages 배포 시 D1 데이터베이스 설정

### 방법 1: Cloudflare 대시보드에서 설정 (권장)

1. Cloudflare 대시보드 접속
2. **Workers & Pages** → **D1** 메뉴로 이동
3. **Create database** 클릭
4. 데이터베이스 이름: `nam-db` 입력
5. 생성 후 **database_id** 복사

6. **Workers & Pages** → **Pages** → 프로젝트 선택
7. **Settings** → **Functions** → **D1 Database bindings** 섹션
8. **Add binding** 클릭
9. 설정:
   - **Variable name**: `DB`
   - **D1 Database**: `nam-db` 선택
10. **Save** 클릭

### 방법 2: wrangler.toml에 직접 설정

1. D1 데이터베이스 생성:
   ```bash
   wrangler d1 create nam-db
   ```

2. 출력된 `database_id`를 복사

3. `wrangler.toml` 파일 수정:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "nam-db"
   database_id = "복사한-database-id-여기에-입력"
   ```

4. Git에 커밋 및 푸시:
   ```bash
   git add wrangler.toml
   git commit -m "Add D1 database configuration"
   git push
   ```

### 데이터베이스 마이그레이션

데이터베이스 생성 후 스키마를 적용해야 합니다:

```bash
# 프로덕션 데이터베이스에 마이그레이션 적용
wrangler d1 execute nam-db --file=./schema.sql

# 또는 로컬 개발용
wrangler d1 execute nam-db --local --file=./schema.sql
```

### 주의사항

- `database_id`는 실제 값으로 교체해야 배포가 성공합니다
- `your-database-id-here`는 플레이스홀더이므로 그대로 두면 배포 실패
- Pages 대시보드에서 바인딩을 설정하면 `wrangler.toml`의 `database_id`는 필요 없을 수 있습니다

