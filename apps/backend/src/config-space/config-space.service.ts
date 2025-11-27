import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { IConfigSpaceService } from './interfaces/config-space.interface';
import {
  CreateConfigSpaceDto,
  UpdateConfigSpaceDto,
  ConfigSpaceResponseDto,
  QueryConfigSpaceDto,
  ValidateConfigResponseDto,
  ConfigSpaceJson,
  ParameterDefinition,
} from './dto/config-space.dto';
import { PaginatedResponse } from '../common/types/base.types';

@Injectable()
export class ConfigSpaceService implements IConfigSpaceService {
  private readonly configSpaceDir: string;

  constructor() {
    // 统一使用 configs/space 目录存储所有配置空间（包括用户自定义的）
    const backendDir = process.cwd();
    this.configSpaceDir = path.resolve(backendDir, '..', 'configs', 'space');
    
    // 确保目录存在
    if (!fs.existsSync(this.configSpaceDir)) {
      fs.mkdirSync(this.configSpaceDir, { recursive: true });
    }
  }

  async create(createDto: CreateConfigSpaceDto): Promise<ConfigSpaceResponseDto> {
    const { name, description, space } = createDto;

    // 验证配置空间格式
    this.validateConfigSpaceFormat(space);

    // 检查是否已存在同名配置空间
    const fileName = `${name}.json`;
    const filePath = path.join(this.configSpaceDir, fileName);
    if (fs.existsSync(filePath)) {
      throw new BadRequestException(`Config space with name '${name}' already exists`);
    }

    // 直接保存参数定义到 configs/space 目录（简化格式）
    fs.writeFileSync(filePath, JSON.stringify(space, null, 2), 'utf-8');

    // 返回响应
    const stats = fs.statSync(filePath);
    return {
      id: name, // 使用名称作为ID
      name,
      description,
      space,
      isPreset: false,
      parameterCount: Object.keys(space).length,
      createdAt: stats.birthtime,
      updatedAt: stats.mtime,
    };
  }

  async findAll(query: QueryConfigSpaceDto): Promise<PaginatedResponse<ConfigSpaceResponseDto>> {
    // 直接从文件系统加载所有配置空间
    let items = await this.loadAllConfigSpaces();

    // 搜索过滤
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower),
      );
    }

    // 预设配置空间过滤
    if (query.isPreset !== undefined) {
      items = items.filter((item) => item.isPreset === query.isPreset);
    }

    // 分页
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    const paginatedItems = items.slice(start, end);

    return {
      items: paginatedItems,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async findOne(id: string): Promise<ConfigSpaceResponseDto> {
    // ID就是文件名（不含.json后缀）
    const fileName = `${id}.json`;
    const filePath = path.join(this.configSpaceDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Config space with id ${id} not found`);
    }

    return await this.loadConfigSpaceFromFile(filePath, id);
  }

  async findByName(name: string): Promise<ConfigSpaceResponseDto | null> {
    // 尝试直接根据名称查找文件
    const fileName = `${name}.json`;
    const filePath = path.join(this.configSpaceDir, fileName);
    
    if (fs.existsSync(filePath)) {
      return await this.loadConfigSpaceFromFile(filePath, name);
    }

    // 如果没找到，遍历所有文件查找
    const allSpaces = await this.loadAllConfigSpaces();
    const found = allSpaces.find((s) => s.name === name);
    return found || null;
  }

  async update(id: string, updateDto: UpdateConfigSpaceDto): Promise<ConfigSpaceResponseDto> {
    const fileName = `${id}.json`;
    const filePath = path.join(this.configSpaceDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Config space with id ${id} not found`);
    }

    // 读取现有配置空间
    const existing = await this.loadConfigSpaceFromFile(filePath, id);
    let space = existing.space;

    // 更新 space
    if (updateDto.space !== undefined) {
      this.validateConfigSpaceFormat(updateDto.space);
      space = updateDto.space;
    }

    // 如果名称改变了，需要重命名文件
    if (updateDto.name && updateDto.name !== id) {
      const newFileName = `${updateDto.name}.json`;
      const newFilePath = path.join(this.configSpaceDir, newFileName);
      
      if (fs.existsSync(newFilePath)) {
        throw new BadRequestException(`Config space with name '${updateDto.name}' already exists`);
      }
      
      // 保存到新文件（简化格式，直接保存参数定义）
      fs.writeFileSync(newFilePath, JSON.stringify(space, null, 2), 'utf-8');
      // 删除旧文件
      fs.unlinkSync(filePath);
      
      // 返回新的配置空间
      return await this.loadConfigSpaceFromFile(newFilePath, updateDto.name);
    } else {
      // 保存到原文件（简化格式，直接保存参数定义）
      fs.writeFileSync(filePath, JSON.stringify(space, null, 2), 'utf-8');
      return await this.loadConfigSpaceFromFile(filePath, id);
    }
  }

  async remove(id: string): Promise<void> {
    const fileName = `${id}.json`;
    const filePath = path.join(this.configSpaceDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Config space with id ${id} not found`);
    }

    // 检查是否是预设配置空间（expert_space 和 huge_space）
    if (id === 'expert_space' || id === 'huge_space') {
      throw new BadRequestException('Cannot remove preset config spaces.');
    }

    // 删除文件
    fs.unlinkSync(filePath);
  }

  async validateConfig(
    config: Record<string, any>,
    spaceId?: string,
  ): Promise<ValidateConfigResponseDto> {
    let targetSpace: ConfigSpaceJson;

    if (spaceId) {
      const stored = await this.findOne(spaceId);
      targetSpace = stored.space;
    } else {
      targetSpace = await this.loadDefaultConfigSpace();
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证提供的参数
    for (const paramName in config) {
      if (!targetSpace[paramName]) {
        warnings.push(`Parameter '${paramName}' is not defined in the config space.`);
        continue;
      }

      const paramDef = targetSpace[paramName];
      const value = config[paramName];

      if (paramDef.type === 'integer') {
        if (!Number.isInteger(value)) {
          errors.push(`Parameter '${paramName}' must be an integer.`);
        } else if (value < paramDef.min || value > paramDef.max) {
          errors.push(
            `Parameter '${paramName}' must be between ${paramDef.min} and ${paramDef.max}.`,
          );
        }
      } else if (paramDef.type === 'float') {
        if (typeof value !== 'number') {
          errors.push(`Parameter '${paramName}' must be a number.`);
        } else if (value < paramDef.min || value > paramDef.max) {
          errors.push(
            `Parameter '${paramName}' must be between ${paramDef.min} and ${paramDef.max}.`,
          );
        }
      }
    }

    // 检查缺失的参数
    for (const paramName in targetSpace) {
      if (!(paramName in config)) {
        warnings.push(`Parameter '${paramName}' from config space is not provided in the config.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  async loadFromFile(filePath: string): Promise<ConfigSpaceJson> {
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    let space: ConfigSpaceJson;
    
    // 处理 expert_space.json 的特殊格式（兼容旧格式）
    if (data.spark && Array.isArray(data.spark)) {
      space = await this.loadExpertSpaceFromArray(data.spark);
    }
    // 处理旧的标准格式（包含 space 字段）- 兼容性保留
    else if (data.space && typeof data.space === 'object') {
      space = data.space;
    }
    // 简化格式（直接是参数定义）- 新的默认格式
    else {
      space = data as ConfigSpaceJson;
    }
    
    this.validateConfigSpaceFormat(space);
    return space;
  }

  async getParameterNames(spaceId: string): Promise<string[]> {
    const stored = await this.findOne(spaceId);
    return Object.keys(stored.space);
  }

  async getParameterDefinition(
    spaceId: string,
    parameterName: string,
  ): Promise<ConfigSpaceJson[string] | null> {
    const stored = await this.findOne(spaceId);
    return stored.space[parameterName] || null;
  }

  // 私有辅助方法

  private async loadAllConfigSpaces(): Promise<ConfigSpaceResponseDto[]> {
    const spaces: ConfigSpaceResponseDto[] = [];

    if (!fs.existsSync(this.configSpaceDir)) {
      return spaces;
    }

    const files = fs.readdirSync(this.configSpaceDir).filter((file) => file.endsWith('.json'));

    for (const file of files) {
      try {
        const filePath = path.join(this.configSpaceDir, file);
        const fileName = path.basename(file, '.json');
        const space = await this.loadConfigSpaceFromFile(filePath, fileName);
        spaces.push(space);
      } catch (error) {
        console.error(`Failed to load config space from ${file}:`, error);
      }
    }

    return spaces;
  }

  private async loadConfigSpaceFromFile(
    filePath: string,
    id: string,
  ): Promise<ConfigSpaceResponseDto> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    let space: ConfigSpaceJson;
    let name: string = id;
    let description: string | undefined;
    
    // 处理 expert_space.json 的特殊格式（兼容旧格式）
    if (data.spark && Array.isArray(data.spark)) {
      space = await this.loadExpertSpaceFromArray(data.spark);
      name = data.name || id;
      description = data.description || `Expert config space with ${data.spark.length} parameters`;
    } 
    // 处理旧的标准格式（包含 name 和 space 字段）- 兼容性保留
    else if (data.space && typeof data.space === 'object') {
      space = data.space;
      name = data.name || id;
      description = data.description;
    }
    // 简化格式（直接是参数定义）- 新的默认格式
    else {
      space = data as ConfigSpaceJson;
      name = id;
      description = undefined;
    }

    // 获取文件元数据
    const stats = fs.statSync(filePath);
    
    // 判断是否是预设配置空间
    const isPreset = (id === 'expert_space' || id === 'huge_space');

    return {
      id,
      name,
      description,
      space,
      isPreset,
      parameterCount: Object.keys(space).length,
      createdAt: stats.birthtime,
      updatedAt: stats.mtime,
    };
  }

  private async loadExpertSpaceFromArray(paramNames: string[]): Promise<ConfigSpaceJson> {
    const hugeSpacePath = path.join(this.configSpaceDir, 'huge_space.json');
    if (!fs.existsSync(hugeSpacePath)) {
      throw new BadRequestException('huge_space.json not found, cannot load expert_space.json');
    }

    const hugeSpace = await this.loadFromFile(hugeSpacePath);
    
    const expertSpace: ConfigSpaceJson = {};
    for (const paramName of paramNames) {
      if (hugeSpace[paramName]) {
        expertSpace[paramName] = hugeSpace[paramName];
      }
    }

    return expertSpace;
  }

  private async loadDefaultConfigSpace(): Promise<ConfigSpaceJson> {
    const hugeSpacePath = path.join(this.configSpaceDir, 'huge_space.json');
    if (fs.existsSync(hugeSpacePath)) {
      return await this.loadFromFile(hugeSpacePath);
    }

    const expertSpacePath = path.join(this.configSpaceDir, 'expert_space.json');
    if (fs.existsSync(expertSpacePath)) {
      return await this.loadFromFile(expertSpacePath);
    }

    throw new NotFoundException('Default config space not found');
  }

  private validateConfigSpaceFormat(space: ConfigSpaceJson): void {
    for (const [key, value] of Object.entries(space)) {
      if (!value || typeof value !== 'object') {
        throw new BadRequestException(`Invalid parameter definition for ${key}: must be an object`);
      }

      const paramDef = value as ParameterDefinition;
      if (!['integer', 'float'].includes(paramDef.type)) {
        throw new BadRequestException(`Invalid type for ${key}: must be 'integer' or 'float'`);
      }

      if (typeof paramDef.min !== 'number' || typeof paramDef.max !== 'number') {
        throw new BadRequestException(`Invalid min/max for ${key}: must be numbers`);
      }

      if (paramDef.min >= paramDef.max) {
        throw new BadRequestException(`Invalid range for ${key}: min must be less than max`);
      }

      if (typeof paramDef.default !== 'number') {
        throw new BadRequestException(`Invalid default for ${key}: must be a number`);
      }

      if (paramDef.default < paramDef.min || paramDef.default > paramDef.max) {
        throw new BadRequestException(`Invalid default for ${key}: must be within [min, max] range`);
      }
    }
  }
}
