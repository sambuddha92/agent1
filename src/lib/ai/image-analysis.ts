import { RekognitionClient, DetectLabelsCommand } from '@aws-sdk/client-rekognition';
import sharp from 'sharp';

const client = new RekognitionClient({
  region: process.env.AWS_REGION,
});

// ============================================
// Plant-Related Keywords for Detection
// ============================================
const PLANT_KEYWORDS = new Set([
  // Common plant types
  'plant', 'flower', 'flowering plant', 'herb', 'grass', 'fern', 'moss', 'succulent',
  'cactus', 'tree', 'shrub', 'bush', 'vine', 'climber', 'creeper', 'ivy',
  'orchid', 'rose', 'lily', 'tulip', 'daffodil', 'sunflower', 'daisy', 'chrysanthemum',
  'peony', 'hydrangea', 'lavender', 'geranium', 'petunia', 'zinnia', 'marigold',
  'vegetable', 'herb', 'basil', 'mint', 'parsley', 'tomato', 'lettuce', 'pepper',
  
  // Gardening-specific
  'garden', 'balcony garden', 'potted plant', 'pot', 'planter', 'flower pot',
  'container', 'raised bed', 'seedling', 'botanical', 'foliage', 'leaf', 'leaves',
  'bloom', 'blossom', 'petal', 'stem', 'root', 'soil', 'mulch',
  
  // Garden elements
  'flowerpot', 'terracotta', 'nursery', 'greenhouse', 'conservatory',
  'botanical garden', 'hanging basket', 'window box',
  
  // Seasonal/natural
  'spring flower', 'summer plant', 'fall foliage', 'winter plant',
  'green', 'greenery', 'vegetation', 'flora', 'nature', 'natural',
]);

// Non-plant keywords to explicitly exclude
const NON_PLANT_KEYWORDS = new Set([
  'person', 'people', 'human', 'face', 'hand', 'animal', 'dog', 'cat', 'bird',
  'car', 'building', 'furniture', 'food', 'dish', 'plate', 'cup', 'glass',
  'book', 'computer', 'phone', 'electronic', 'technology',
]);

/**
 * Analyze image for plant relevance
 * Returns both labels and a plant relevance assessment
 */
export const analyzeImageWithRelevance = async (
  buffer: Buffer,
  mimeType?: string
): Promise<{ labels: string[]; isPlantRelated: boolean; confidence: number; analysis: string }> => {
  console.log('[analyzeImageWithRelevance] Processing image:', { bufferLength: buffer.length, mimeType });
  
  let processedBuffer = buffer;
  
  // Convert unsupported formats to JPEG
  if (mimeType && (mimeType.includes('webp') || mimeType.includes('gif') || mimeType.includes('heic') || mimeType.includes('svg'))) {
    console.log('[analyzeImageWithRelevance] Converting unsupported format to JPEG:', mimeType);
    try {
      processedBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
    } catch (conversionError) {
      console.error('[analyzeImageWithRelevance] Format conversion failed:', conversionError);
      return {
        labels: [],
        isPlantRelated: false,
        confidence: 0,
        analysis: 'Image format conversion failed'
      };
    }
  }
  
  try {
    const uint8Array = new Uint8Array(processedBuffer);
    
    const { Labels } = await client.send(new DetectLabelsCommand({
      Image: { Bytes: uint8Array },
      MaxLabels: 15,
      MinConfidence: 70
    }));

    if (!Labels || Labels.length === 0) {
      return {
        labels: [],
        isPlantRelated: false,
        confidence: 0,
        analysis: 'No identifiable objects detected'
      };
    }

    const labels = Labels
      .filter(label => label.Confidence && label.Confidence >= 70)
      .map(label => label.Name)
      .filter((name): name is string => !!name);

    // Assess plant relevance
    const lowerLabels = labels.map(l => l.toLowerCase());
    
    // Check for non-plant content
    const hasNonPlant = lowerLabels.some(label => 
      NON_PLANT_KEYWORDS.has(label) || 
      NON_PLANT_KEYWORDS.has(label.toLowerCase())
    );

    // Check for plant content
    const plantMatches = lowerLabels.filter(label =>
      PLANT_KEYWORDS.has(label) || 
      PLANT_KEYWORDS.has(label.toLowerCase())
    ).length;

    // Calculate plant relevance
    const isPlantRelated = plantMatches > 0 || (!hasNonPlant && labels.length > 0 && labels[0].toLowerCase().includes('green'));
    const confidence = plantMatches > 0 ? Math.min(1, plantMatches / labels.length) : (hasNonPlant ? 0 : 0.3);

    const analysis = labels.length > 0 
      ? `Detected: ${labels.join(', ')}`
      : 'No identifiable objects found';

    console.log('[analyzeImageWithRelevance] Result:', { 
      labels, 
      isPlantRelated, 
      confidence, 
      hasNonPlant,
      plantMatches
    });

    return { labels, isPlantRelated, confidence, analysis };
  } catch (error) {
    console.error('[analyzeImageWithRelevance] Error analyzing image:', error);
    return {
      labels: [],
      isPlantRelated: false,
      confidence: 0,
      analysis: 'Error analyzing image'
    };
  }
};

/**
 * Legacy function - kept for backward compatibility
 * Returns only the analysis text
 */
export const analyzeImage = async (buffer: Buffer, mimeType?: string): Promise<string> => {
  const result = await analyzeImageWithRelevance(buffer, mimeType);
  return result.analysis;
};
