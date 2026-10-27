<template>
  <div class="example-component">
    <h1>{{ title }}</h1>

    <div class="user-list">
      <div v-for="user in users" :key="user.id" class="user-card">
        <h2>{{ user.name }}</h2>
        <p>Email: {{ user.email }}</p>
        <p>状态: {{ user.isActive ? "活跃" : "不活跃" }}</p>
        <button @click="toggleStatus(user)">切换状态</button>
      </div>
    </div>

    <div class="add-user">
      <input v-model="newUser.name" placeholder="姓名" />
      <input v-model="newUser.email" placeholder="邮箱" type="email" />
      <button @click="addUser">添加用户</button>
    </div>

    <p v-if="loading">加载中...</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

export default defineComponent({
  name: "ExampleComponent",
  data() {
    return {
      title: "用户管理系统",
      users: [] as User[],
      newUser: {
        name: "",
        email: "",
        isActive: true,
      } as Omit<User, "id">,
      loading: false,
      nextId: 1,
    };
  },
  methods: {
    addUser() {
      if (!this.newUser.name || !this.newUser.email) {
        alert("请输入姓名和邮箱");
        return;
      }

      this.users.push({
        id: this.nextId++,
        ...this.newUser,
      });

      // 重置表单
      this.newUser = {
        name: "",
        email: "",
        isActive: true,
      };
    },
    toggleStatus(user: User) {
      user.isActive = !user.isActive;
    },
    async fetchUsers() {
      this.loading = true;
      try {
        // 模拟API调用
        await new Promise((resolve) => setTimeout(resolve, 1000));
        this.users = [
          {
            id: 1,
            name: "初始用户1",
            email: "user1@example.com",
            isActive: true,
          },
          {
            id: 2,
            name: "初始用户2",
            email: "user2@example.com",
            isActive: false,
          },
        ];
        this.nextId = this.users.length + 1;
      } catch (error) {
        console.error("获取用户失败:", error);
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    this.fetchUsers();
  },
  computed: {
    activeUsers(): User[] {
      return this.users.filter((user) => user.isActive);
    },
    inactiveUsers(): User[] {
      return this.users.filter((user) => !user.isActive);
    },
  },
});
</script>

<style scoped>
.example-component {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.user-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.user-card {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
}

.add-user {
  margin-top: 30px;
  display: flex;
  gap: 10px;
}

input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 8px 16px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #369f6b;
}
</style>
