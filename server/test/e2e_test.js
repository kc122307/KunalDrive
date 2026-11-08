import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting Full E2E Test Suite for Google Drive Clone');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    assert(health.status === 'healthy', 'Backend health check returns status: healthy');

    // 2. Demo User Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@google.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.ok && !!loginData.token, 'Demo user authentication successful with JWT');
    const token = loginData.token;
    const authHeaders = {
      'Authorization': `Bearer ${token}`
    };

    // 3. User registration test
    const testEmail = `test_${Date.now()}@google.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alex River', email: testEmail, password: 'securePassword123' })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.user.email === testEmail, 'User registration succeeds and generates profile');

    // 4. Create Folder
    const createFolderRes = await fetch(`${BASE_URL}/folders`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Project Workspace', parent_id: null })
    });
    const folderData = await createFolderRes.json();
    assert(createFolderRes.status === 201 && !!folderData.folder.id, 'Folder creation in My Drive succeeds');
    const folderId = folderData.folder.id;

    // 5. Create Subfolder
    const subfolderRes = await fetch(`${BASE_URL}/folders`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Subfolder Alpha', parent_id: folderId })
    });
    const subfolderData = await subfolderRes.json();
    assert(subfolderRes.status === 201 && subfolderData.folder.parent_id === folderId, 'Nested subfolder creation succeeds');

    // 6. Breadcrumbs Resolution
    const breadcrumbRes = await fetch(`${BASE_URL}/folders/breadcrumbs/${subfolderData.folder.id}`, {
      headers: authHeaders
    });
    const breadcrumbData = await breadcrumbRes.json();
    assert(
      breadcrumbData.breadcrumbs.length === 3 &&
      breadcrumbData.breadcrumbs[0].name === 'My Drive' &&
      breadcrumbData.breadcrumbs[1].name === 'Test Project Workspace' &&
      breadcrumbData.breadcrumbs[2].name === 'Subfolder Alpha',
      'Hierarchical breadcrumb path resolution succeeds'
    );

    // 7. Multipart File Upload
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const textFileContent = 'Hello Google Drive Clone! This is persistent test storage content.';
    const csvContent = 'ID,Name,Department,Salary\n1,Kunal,Engineering,150000\n2,Sarah,Design,140000\n3,Liam,Product,145000';

    const bodyParts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="parent_id"\r\n\r\n${folderId}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="notes.txt"\r\nContent-Type: text/plain\r\n\r\n${textFileContent}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="team_salaries.csv"\r\nContent-Type: text/csv\r\n\r\n${csvContent}\r\n`,
      `--${boundary}--\r\n`
    ];
    const uploadBody = Buffer.from(bodyParts.join(''));

    const uploadRes = await fetch(`${BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: uploadBody
    });
    const uploadData = await uploadRes.json();
    assert(uploadRes.status === 201 && uploadData.files.length === 2, 'Multipart multi-file upload succeeds');
    const textFile = uploadData.files.find(f => f.name === 'notes.txt');
    const csvFile = uploadData.files.find(f => f.name === 'team_salaries.csv');

    // 8. Stream File with HTTP Range (Partial Content)
    const streamRes = await fetch(`${BASE_URL}/files/${textFile.id}/stream`, {
      headers: {
        ...authHeaders,
        'Range': 'bytes=0-15'
      }
    });
    assert(streamRes.status === 206, 'HTTP Range streaming returns 206 Partial Content');
    const partialText = await streamRes.text();
    assert(partialText === textFileContent.substring(0, 16), 'Partial content matches exact byte range requested');

    // 9. Download File
    const downloadRes = await fetch(`${BASE_URL}/files/${csvFile.id}/download`, {
      headers: authHeaders
    });
    const downloadedText = await downloadRes.text();
    assert(downloadedText === csvContent, 'File download verifies exact binary content match');

    // 10. Star / Favorites
    const starRes = await fetch(`${BASE_URL}/files/${textFile.id}/star`, {
      method: 'POST',
      headers: authHeaders
    });
    const starData = await starRes.json();
    assert(starData.is_starred === 1, 'File starring toggle succeeds');

    const starredListRes = await fetch(`${BASE_URL}/files?view=starred`, {
      headers: authHeaders
    });
    const starredList = await starredListRes.json();
    assert(starredList.files.some(f => f.id === textFile.id), 'Starred item appears in Starred view');

    // 11. Rename File
    const renameRes = await fetch(`${BASE_URL}/files/${textFile.id}/rename`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'meeting_notes_updated.txt' })
    });
    const renameData = await renameRes.json();
    assert(renameData.file.name === 'meeting_notes_updated.txt', 'File rename succeeds');

    // 12. Copy / Duplicate File
    const copyRes = await fetch(`${BASE_URL}/files/${textFile.id}/copy`, {
      method: 'POST',
      headers: authHeaders
    });
    const copyData = await copyRes.json();
    assert(copyData.file.name === 'Copy of meeting_notes_updated.txt', 'Make a copy duplicates file record & binary');

    // 13. Search Files
    const searchRes = await fetch(`${BASE_URL}/files/search?q=salaries&type=spreadsheet`, {
      headers: authHeaders
    });
    const searchData = await searchRes.json();
    assert(searchData.files.length >= 1 && searchData.files[0].name === 'team_salaries.csv', 'Keyword & category search returns matching items');

    // 14. File Sharing & Public Link Access
    const shareRes = await fetch(`${BASE_URL}/shares`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: csvFile.id, permission: 'viewer', is_public: 1 })
    });
    const shareData = await shareRes.json();
    assert(shareRes.status === 201 && !!shareData.share.token, 'Shareable link generated with access token');
    const shareToken = shareData.share.token;

    // Access via public share token without Bearer auth header
    const publicShareRes = await fetch(`${BASE_URL}/shares/public/${shareToken}`);
    const publicShareData = await publicShareRes.json();
    assert(publicShareRes.status === 200 && publicShareData.file.id === csvFile.id, 'Public link access succeeds without login');

    // 15. Storage Management Summary
    const storageRes = await fetch(`${BASE_URL}/storage/summary`, {
      headers: authHeaders
    });
    const storageData = await storageRes.json();
    assert(storageData.used > 0 && storageData.quota === 16106127360, 'Storage usage tracking and 15GB quota calculations verify correctly');

    // 16. Folder Download as ZIP
    const zipRes = await fetch(`${BASE_URL}/folders/${folderId}/download-zip`, {
      headers: authHeaders
    });
    assert(
      zipRes.status === 200 &&
      zipRes.headers.get('content-type') === 'application/zip',
      'Recursive folder download as streaming ZIP archive succeeds'
    );

    // 17. Trash & Restore
    const trashRes = await fetch(`${BASE_URL}/files/${copyData.file.id}/trash`, {
      method: 'POST',
      headers: authHeaders
    });
    const trashData = await trashRes.json();
    assert(trashData.is_trashed === 1, 'File moved to Trash');

    const trashListRes = await fetch(`${BASE_URL}/files?view=trash`, {
      headers: authHeaders
    });
    const trashList = await trashListRes.json();
    assert(trashList.files.some(f => f.id === copyData.file.id), 'Trashed item appears in Trash view');

    const restoreRes = await fetch(`${BASE_URL}/files/${copyData.file.id}/restore`, {
      method: 'POST',
      headers: authHeaders
    });
    const restoreData = await restoreRes.json();
    assert(restoreData.is_trashed === 0, 'Item successfully restored from Trash');

    // 18. Permanent Deletion
    const permRes = await fetch(`${BASE_URL}/files/${copyData.file.id}/permanent`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert(permRes.status === 200, 'Permanent file deletion purges record and frees disk storage');

    console.log('\n====================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} passed, ${failed} failed`);
    console.log('====================================================');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
