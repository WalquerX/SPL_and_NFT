import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { fetchAsset, mplCore, update } from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";
import wallet from "../../devnet-wallet.json";

const ASSET = "FDBYcPxgp3e1dopaee9t524S39XGfyLw89CoVzrDzRvM";
const IMAGE = "https://gateway.irys.xyz/8ssLY2kFzZJYYzxdeLN4vAK6M1h5uimtf97momV8K2Wd";

const umi = createUmi("https://api.devnet.solana.com");

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader({ address: "https://devnet.irys.xyz/" }));
umi.use(signerIdentity(signer));
umi.use(mplCore());

(async () => {
  try {
    const asset = await fetchAsset(umi, publicKey(ASSET));
    console.log(`old name: ${asset.name}`);
    console.log(`old uri : ${asset.uri}`);

    const newUri = await umi.uploader.uploadJson({
      name: "Panda tea v2",
      symbol: "PANDA",
      description: "Updated by the update authority.",
      image: IMAGE,
      attributes: [
        { trait_type: "species", value: "panda" },
        { trait_type: "revision", value: "2" },
      ],
      properties: {
        files: [{ type: "image/jpeg", uri: IMAGE }],
        category: "image",
      },
    });

    const tx = await update(umi, {
      asset,
      name: "Panda tea v2",
      uri: newUri,
    }).sendAndConfirm(umi);

    const after = await fetchAsset(umi, publicKey(ASSET));
    console.log(`new name: ${after.name}`);
    console.log(`new uri : ${after.uri}`);
    console.log(`signature: ${base58.deserialize(tx.signature)[0]}`);
  } catch (e) {
    console.log(`error ${e}`);
  }
})();