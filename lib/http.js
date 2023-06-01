// 通过 axios 处理请求
const axios = require('axios')

const baseURL = 'http://19.87.8.34'
const privateAccessToken = 'bFh-m9yRT8mejbCXxxyP'

axios.interceptors.request.use(config => {
  config.baseURL = `${baseURL}/api/v4`
  config.headers['PRIVATE-TOKEN'] = privateAccessToken
  return config
})

axios.interceptors.response.use(res => {
  return res.data
})

/**
 * 获取模板列表
 * @returns Promise
 */
async function getRepoList() {
  return axios.get('/users/chenxigeng/projects')
}

/**
 * 获取分支列表
 * @param {string} projectAPIURL 项目 API 地址
 * @returns Promise
 */
async function getBranchesList(projectAPIURL) {
  return axios.get(`${projectAPIURL}/repository/branches`)
}

module.exports = {
  getRepoList,
  getBranchesList
}
