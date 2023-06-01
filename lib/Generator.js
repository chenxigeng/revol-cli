const { getRepoList, getBranchesList } = require('./http')
const ora = require('ora')
const inquirer = require('inquirer')
const path = require('path')
const chalk = require('chalk')
const util = require('util')
const downloadGitRepo = require('download-git-repo')

// 添加加载动画
async function wrapLoading(fn, message, ...args) {
  // 使用 ora 初始化，传入提示信息 message
  const spinner = ora({
    text: message,
    spinner: 'hamburger'
  })
  // 开始加载动画
  spinner.start()

  try {
    // 执行传入方法 fn
    const result = await fn(...args)
    // 状态为修改为成功
    spinner.succeed()
    return result
  } catch (error) {
    // 状态为修改为失败
    spinner.fail('Request failed, refetch ...')
  }
}

class Generator {
  constructor(name, targetDir) {
    // 目录名称
    this.name = name
    // 创建位置
    this.targetDir = targetDir

    // 对 download-git-repo 进行 promise 化改造
    this.downloadGitRepo = util.promisify(downloadGitRepo)
  }

  // 获取用户选择的模板
  // 1）从远程拉取模板数据
  // 2）用户选择自己新下载的模板名称
  // 3）return 用户选择的名称

  async getRepo() {
    // 1）从远程拉取模板数据
    const repoList = await wrapLoading(getRepoList, 'waiting fetch template')
    if (!repoList) return

    console.log('repoList', repoList)
    // 过滤我们需要的模板名称
    const repos = repoList.map(item => ({
      name: item.name,
      value: item.id
    }))

    // 2）用户选择自己新下载的模板名称
    const { repoId } = await inquirer.prompt({
      name: 'repoId',
      type: 'list',
      choices: repos,
      message: 'Please choose a template to create project'
    })

    // 3）return 用户选择的名称
    const repoItem = repoList.find(item => item.id === repoId)
    return {
      name: repoItem.name || '',
      project_api_url: repoItem._links.self || ''
    }
  }

  // 获取用户选择的版本
  // 1）基于 repo 结果，远程拉取对应的 branch 列表
  // 2）用户选择自己需要下载的 branch
  // 3）return 用户选择的 branch

  async getBranches(repo) {
    // 1）基于 repo 结果，远程拉取对应的 tag 列表
    const branches = await wrapLoading(getBranchesList, 'waiting fetch branches', repo.project_api_url)
    if (!branches) return

    console.log('branches', branches)
    // 过滤我们需要的 branches 名称
    const branchesList = branches.map(item => {
      return {
        name: item.name,
        value: item.commit.id
      }
    })

    // 2）用户选择自己需要下载的 branch
    const { branchId } = await inquirer.prompt({
      name: 'branchId',
      type: 'list',
      choices: branchesList,
      message: 'Place choose a branch to create project'
    })

    // 3）return 用户选择的 branch
    return branchId
  }

  // 下载远程模板
  // 1）拼接下载地址
  // 2）调用下载方法
  async download(repo, branchId) {
    // 1）拼接下载地址（这里使用direct:前缀，不然无法下载）
    const requestUrl = `direct:${repo.project_api_url}/repository/archive.zip?ref=${branchId}`

    // 2）调用下载方法
    await wrapLoading(
      this.downloadGitRepo, // 远程下载方法
      'waiting download template', // 加载提示信息
      requestUrl, // 参数1: 下载地址
      path.resolve(process.cwd(), this.targetDir),
      { headers: { 'PRIVATE-TOKEN': 'bFh-m9yRT8mejbCXxxyP' } }
    ) // 参数2: 创建位置
  }

  // 核心创建逻辑
  // 1）获取模板名称
  // 2）获取 branch 名称
  // 3）下载模板到模板目录
  async create() {
    // 1）获取模板名称
    const repo = await this.getRepo()
    console.log('repo', repo)

    // 2) 获取 branch 名称
    const branchId = await this.getBranches(repo)

    // // 3) 下载模板到模板目录
    await this.download(repo, branchId)

    // 4) 模板使用提示
    console.log(`\r\nSuccessfully created project ${chalk.cyan(this.name)}`)
    console.log(`\r\n  cd ${chalk.cyan(this.name)}`)
    console.log('  npm run dev\r\n')
  }
}

module.exports = Generator
