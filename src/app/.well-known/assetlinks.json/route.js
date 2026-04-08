import { NextResponse } from 'next/server';

// Android App Links verification
// Replace YOUR_SHA256_FINGERPRINT with output from: ./gradlew signingReport
const assetlinks = [
    {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
            namespace: 'android_app',
            package_name: 'co.hivezone.app',
            sha256_cert_fingerprints: [
                'A2:EB:1A:27:AB:7D:82:F2:F9:C6:6D:7D:ED:A0:DE:25:14:7F:3B:4F:07:F6:A2:04:C4:87:E9:91:C7:CA:48:9A'
            ]
        }
    }
];

export async function GET() {
    return NextResponse.json(assetlinks, {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}
