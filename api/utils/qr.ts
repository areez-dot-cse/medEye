import QRCode from "qrcode";

export async function generateQr(uid: string, signature: string){
    const payload = JSON.stringify({uid, signature});

    return await QRCode.toDataURL(payload);
}
