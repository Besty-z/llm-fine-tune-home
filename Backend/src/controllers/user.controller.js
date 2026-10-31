// 用户控制器（占位）：TODO 后续补充业务逻辑

/** 用户注册 */
exports.register = async (req, res) => {
  // TODO: 校验入参 -> 密码加密 -> 写入 User 集合
  res.json({ message: 'register 接口待实现' })
}

/** 用户登录 */
exports.login = async (req, res) => {
  // TODO: 校验账号密码 -> 签发 JWT
  res.json({ message: 'login 接口待实现' })
}

/** 用户列表 */
exports.getUsers = async (req, res) => {
  // TODO: 查询 User 集合（分页）
  res.json({ message: 'getUsers 接口待实现' })
}
