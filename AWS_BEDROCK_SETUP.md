# AWS Bedrock Model Access Setup

## Current Status
✅ **Amazon Nova models** are enabled and working
⚠️ **Anthropic Claude models** require additional AWS setup

## Temporary Configuration
The app is currently using:
- T1: Nova Micro
- T2: Nova Lite  
- T3: Nova Lite (should be Claude Haiku)
- T4: Nova Pro (should be Claude Sonnet)
- T5: Nova Pro (should be Claude Opus)

## How to Enable Claude Models in AWS Bedrock

### Step 1: Access AWS Bedrock Console
1. Go to AWS Console: https://console.aws.amazon.com/bedrock
2. Navigate to **Bedrock** service
3. Select your region (currently: **us-east-1**)

### Step 2: Request Model Access
1. In the left sidebar, click **Model access**
2. Click **Modify model access** (orange button)
3. Find and check these models:
   - ✅ Anthropic Claude 3.5 Haiku
   - ✅ Anthropic Claude 3.5 Sonnet
   - ✅ Anthropic Claude 3 Opus
4. Click **Request model access**
5. Accept the EULA for each model

### Step 3: Update IAM Permissions
Your IAM user needs these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockInvokeModel",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-*",
        "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-*"
      ]
    },
    {
      "Sid": "MarketplaceSubscribe",
      "Effect": "Allow",
      "Action": [
        "aws-marketplace:ViewSubscriptions",
        "aws-marketplace:Subscribe"
      ],
      "Resource": "*"
    }
  ]
}
```

**⚠️ IMPORTANT:** The AWS Marketplace permissions are required to access models that need subscription approval.

### Step 4: Wait for Access Approval
- Usually instant for most models
- Check status in **Model access** page
- Status should show "Access granted" with green checkmark

### Step 5: Update Model Configuration
Once access is granted, update `src/lib/constants.ts`:

```typescript
export const MODEL_CONFIG = {
  T1_MODEL: 'amazon.nova-micro-v1:0',
  T2_MODEL: 'amazon.nova-lite-v1:0',
  T3_MODEL: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
  T4_MODEL: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
  T5_MODEL: 'us.anthropic.claude-3-opus-20240229-v1:0',
  // ... rest of config
};
```

### Step 6: Restart the App
```bash
# Stop the current dev server
# Then restart:
npm run dev
```

## Cost Considerations

### Current Setup (Nova Models)
- T1 (Micro): $0.035/$0.14 per 1M tokens
- T2 (Lite): $0.06/$0.24 per 1M tokens
- T3-T5 (Pro): $0.80/$3.20 per 1M tokens

### Upgraded Setup (Claude Models)
- T3 (Haiku): $0.80/$4.00 per 1M tokens
- T4 (Sonnet): $3.00/$15.00 per 1M tokens
- T5 (Opus): $15.00/$75.00 per 1M tokens

**Note:** Claude models provide superior quality for complex reasoning tasks, but Nova models are more cost-effective for simple queries.

## Troubleshooting

### "Model access is denied"
- Model access not yet granted in AWS Bedrock Console
- Wait 2-5 minutes after requesting access
- Check IAM permissions include required actions

### "AccessDeniedException" (403)
- IAM user/role lacks `bedrock:InvokeModel` permission
- **Missing AWS Marketplace permissions** - Add `aws-marketplace:ViewSubscriptions` and `aws-marketplace:Subscribe`
- Add the complete IAM policy shown in Step 3 above
- Ensure policy applies to correct region (us-east-1)
- Wait 2 minutes after updating IAM policy for changes to propagate

### "Model access is denied due to IAM user or service role is not authorized to perform the required AWS Marketplace actions"
**This is your current error** - Fix:
1. Go to AWS IAM Console
2. Find your IAM user/role used for Bedrock
3. Add a new inline policy with both Bedrock AND Marketplace permissions (see Step 3)
4. Wait 2 minutes for IAM changes to propagate
5. Try again

### "Invalid model identifier"
- Model ID typo in constants.ts
- Model not available in your region
- Check model availability: https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html

## Additional Resources
- [AWS Bedrock Model Access](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html)
- [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
- [Anthropic Models Documentation](https://docs.anthropic.com/claude/docs)
