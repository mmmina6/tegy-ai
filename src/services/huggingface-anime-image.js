import { InferenceClient } from '@huggingface/inference';

const sizes = {
  '9:16': { width:576, height:1024 },
  '16:9': { width:1024, height:576 },
  '1:1': { width:768, height:768 }
};

export async function generateHuggingFaceAnimeImage({ prompt, aspectRatio = '9:16', client }) {
  const token = process.env.HF_TOKEN;
  const model = process.env.HF_ANIME_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell';
  if (!token && !client) throw new Error('HF_TOKEN is not configured.');
  const inference = client || new InferenceClient(token);
  const size = sizes[aspectRatio] || sizes['9:16'];
  const image = await inference.textToImage({
    model,
    inputs:`High-quality anime production keyframe. ${prompt}. Clean composition, consistent character design, expressive pose, professional Japanese animation art direction, no captions, no logo, no watermark.`,
    parameters:{ ...size, num_inference_steps:4 }
  });
  const bytes = Buffer.from(await image.arrayBuffer());
  return { dataUrl:`data:${image.type || 'image/png'};base64,${bytes.toString('base64')}`, model, provider:'Hugging Face Inference Providers', trial:true };
}
