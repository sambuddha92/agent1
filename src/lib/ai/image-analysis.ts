import { RekognitionClient, DetectLabelsCommand } from '@aws-sdk/client-rekognition';
import sharp from 'sharp';

const client = new RekognitionClient({
  region: process.env.AWS_REGION,
});

export const analyzeImage = async (buffer: Buffer, mimeType?: string): Promise<string> => {
  console.log('[analyzeImage] Processing image:', { bufferLength: buffer.length, mimeType });
  
  let processedBuffer = buffer;
  
  // Convert unsupported formats to JPEG
  if (mimeType && (mimeType.includes('webp') || mimeType.includes('gif') || mimeType.includes('heic') || mimeType.includes('svg'))) {
    console.log('[analyzeImage] Converting unsupported format to JPEG:', mimeType);
    try {
      processedBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
      console.log('[analyzeImage] Format conversion successful:', { originalSize: buffer.length, newSize: processedBuffer.length });
    } catch (conversionError) {
      console.error('[analyzeImage] Format conversion failed:', conversionError);
      return 'Image format conversion failed';
    }
  }
  
  try {
    // Convert Buffer to Uint8Array for AWS SDK
    const uint8Array = new Uint8Array(processedBuffer);
    
    console.log('[analyzeImage] Sending to Rekognition:', { uint8ArrayLength: uint8Array.length });
    
    const { Labels } = await client.send(new DetectLabelsCommand({
      Image: { Bytes: uint8Array },
      MaxLabels: 10,
      MinConfidence: 75
    }));

    if (!Labels) return 'No notable objects detected';

    const filteredLabels = Labels
      .filter(label => label.Confidence && label.Confidence >= 75)
      .map(label => label.Name)
      .filter((name): name is string => !!name);

    return filteredLabels.length > 0 
      ? `Detected: ${filteredLabels.join(', ')}` 
      : 'No identifiable objects found';
  } catch (error) {
    console.error('[analyzeImage] Error analyzing image:', error);
    throw error;
  }
};
