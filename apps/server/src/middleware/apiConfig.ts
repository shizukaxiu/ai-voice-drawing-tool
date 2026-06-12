import type { Request, Response, NextFunction } from 'express'
import { runWithConfig, type ApiConfig } from '../services/apiConfig'

export function apiConfigMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const config: ApiConfig = {
    iflytekAppId: req.headers['x-iflytek-app-id'] as string | undefined,
    iflytekApiKey: req.headers['x-iflytek-api-key'] as string | undefined,
    iflytekApiSecret: req.headers['x-iflytek-api-secret'] as string | undefined,
    deepseekApiKey: req.headers['x-deepseek-api-key'] as string | undefined,
    dashscopeApiKey: req.headers['x-dashscope-api-key'] as string | undefined,
    dashscopeImageModel: req.headers['x-dashscope-image-model'] as
      | string
      | undefined,
    deepseekModel: req.headers['x-deepseek-model'] as string | undefined,
  }

  runWithConfig(config, () => {
    next()
  })
}
