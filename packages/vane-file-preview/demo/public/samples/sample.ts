// 接口定义
interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

// 类实现
class UserService {
  private users: User[] = [];

  // 添加用户
  addUser(user: User): void {
    this.users.push(user);
  }

  // 获取所有用户
  getAllUsers(): User[] {
    return this.users;
  }

  // 根据ID查找用户
  getUserById(id: number): User | undefined {
    return this.users.find((user) => user.id === id);
  }
}

// 使用示例
const userService = new UserService();

userService.addUser({
  id: 1,
  name: "张三",
  email: "zhangsan@example.com",
  isActive: true,
});

userService.addUser({
  id: 2,
  name: "李四",
  email: "lisi@example.com",
  isActive: false,
});

console.log("所有用户:", userService.getAllUsers());
console.log("ID为1的用户:", userService.getUserById(1));

// 泛型函数示例
function identity<T>(arg: T): T {
  return arg;
}

const output = identity<string>("TypeScript很棒!");
console.log(output);

// 异步函数示例
async function fetchData(url: string): Promise<any> {
  const response = await fetch(url);
  return response.json();
}

// 使用示例
fetchData("https://api.example.com/users")
  .then((data) => console.log("获取的数据:", data))
  .catch((error) => console.error("错误:", error));
