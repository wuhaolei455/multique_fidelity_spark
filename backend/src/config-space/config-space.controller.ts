import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ConfigSpaceService } from './config-space.service';
import {
  CreateConfigSpaceDto,
  UpdateConfigSpaceDto,
  ConfigSpaceResponseDto,
  QueryConfigSpaceDto,
  ValidateConfigDto,
  ValidateConfigResponseDto,
} from './dto/config-space.dto';
import { PaginatedResponse } from '../common/types/base.types';

@ApiTags('config-space')
@Controller('api/config-spaces')
export class ConfigSpaceController {
  constructor(private readonly configSpaceService: ConfigSpaceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: '创建配置空间',
    description: '使用简化格式创建配置空间。请求体格式：{ "name": "配置名称", "description": "描述（可选）", "space": { 参数定义对象 } }'
  })
  @ApiResponse({
    status: 201,
    description: '配置空间创建成功',
    type: ConfigSpaceResponseDto,
  })
  async create(@Body() createDto: CreateConfigSpaceDto): Promise<ConfigSpaceResponseDto> {
    return this.configSpaceService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: '获取配置空间列表' })
  @ApiResponse({
    status: 200,
    description: '返回配置空间列表',
    type: ConfigSpaceResponseDto,
    isArray: true,
  })
  async findAll(
    @Query() query: QueryConfigSpaceDto,
  ): Promise<PaginatedResponse<ConfigSpaceResponseDto>> {
    return this.configSpaceService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取配置空间' })
  @ApiParam({ name: 'id', description: '配置空间ID' })
  @ApiResponse({
    status: 200,
    description: '返回配置空间详情',
    type: ConfigSpaceResponseDto,
  })
  async findOne(@Param('id') id: string): Promise<ConfigSpaceResponseDto> {
    return this.configSpaceService.findOne(id);
  }

  @Get('name/:name')
  @ApiOperation({ summary: '根据名称获取配置空间' })
  @ApiParam({ name: 'name', description: '配置空间名称' })
  @ApiResponse({
    status: 200,
    description: '返回配置空间详情',
    type: ConfigSpaceResponseDto,
  })
  async findByName(@Param('name') name: string): Promise<ConfigSpaceResponseDto | null> {
    return this.configSpaceService.findByName(name);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新配置空间' })
  @ApiParam({ name: 'id', description: '配置空间ID' })
  @ApiResponse({
    status: 200,
    description: '配置空间更新成功',
    type: ConfigSpaceResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateConfigSpaceDto,
  ): Promise<ConfigSpaceResponseDto> {
    return this.configSpaceService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除配置空间' })
  @ApiParam({ name: 'id', description: '配置空间ID' })
  @ApiResponse({ status: 204, description: '配置空间删除成功' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.configSpaceService.remove(id);
  }

  @Post('validate')
  @ApiOperation({ summary: '验证配置参数' })
  @ApiResponse({
    status: 200,
    description: '返回验证结果',
    type: ValidateConfigResponseDto,
  })
  async validateConfig(
    @Body() validateDto: ValidateConfigDto,
  ): Promise<ValidateConfigResponseDto> {
    return this.configSpaceService.validateConfig(
      validateDto.config,
      validateDto.spaceId,
    );
  }

  @Get(':id/parameters')
  @ApiOperation({ summary: '获取配置空间的参数列表' })
  @ApiParam({ name: 'id', description: '配置空间ID' })
  @ApiResponse({
    status: 200,
    description: '返回参数名称列表',
    type: [String],
  })
  async getParameterNames(@Param('id') id: string): Promise<string[]> {
    return this.configSpaceService.getParameterNames(id);
  }

  @Get(':id/parameters/:parameterName')
  @ApiOperation({ summary: '获取配置空间的参数定义' })
  @ApiParam({ name: 'id', description: '配置空间ID' })
  @ApiParam({ name: 'parameterName', description: '参数名称' })
  @ApiResponse({
    status: 200,
    description: '返回参数定义',
  })
  async getParameterDefinition(
    @Param('id') id: string,
    @Param('parameterName') parameterName: string,
  ) {
    return this.configSpaceService.getParameterDefinition(id, parameterName);
  }
}

