import { useConfigStore } from '../store/useConfigStore'

export function ConfigPanel() {
  const config = useConfigStore()

  const handleChange = (field: keyof typeof config, value: string) => {
    config.setConfig({ [field]: value })
  }

  const fields: {
    key: keyof typeof config
    label: string
    type?: string
    placeholder?: string
  }[] = [
    { key: 'iflytekAppId', label: '讯飞 App ID', placeholder: '例如：12345678' },
    { key: 'iflytekApiKey', label: '讯飞 API Key', placeholder: '例如：abc123...' },
    {
      key: 'iflytekApiSecret',
      label: '讯飞 API Secret',
      type: 'password',
      placeholder: '例如：secret...',
    },
    {
      key: 'deepseekApiKey',
      label: 'DeepSeek API Key',
      type: 'password',
      placeholder: 'sk-...',
    },
    {
      key: 'deepseekModel',
      label: 'DeepSeek 模型',
      placeholder: 'deepseek-chat',
    },
    {
      key: 'dashscopeApiKey',
      label: 'DashScope API Key',
      type: 'password',
      placeholder: 'sk-...',
    },
    {
      key: 'dashscopeImageModel',
      label: 'DashScope 图像模型',
      placeholder: 'wanx2.1-t2i-turbo',
    },
  ]

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-900">API 配置</h2>
        <p className="text-xs text-gray-500 mt-1">
          配置仅保存在浏览器本地，留空则使用服务端环境变量默认值。
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {fields.map(({ key, label, type, placeholder }) => (
          <div key={key} className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              {label}
            </label>
            <input
              type={type || 'text'}
              value={(config[key] as string) || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>
        ))}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
        <button
          type="button"
          onClick={config.saveConfig}
          className="w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          {config.saved ? '已保存' : '保存配置'}
        </button>
      </div>
    </div>
  )
}
