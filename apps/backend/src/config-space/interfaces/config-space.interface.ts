import {
  ConfigSpaceJson,
  CreateConfigSpaceDto,
  UpdateConfigSpaceDto,
  ConfigSpaceResponseDto,
  QueryConfigSpaceDto,
  ValidateConfigResponseDto,
} from '../dto/config-space.dto';
import { PaginatedResponse } from '../../common/types/base.types';

export interface IConfigSpaceService {
  create(createDto: CreateConfigSpaceDto): Promise<ConfigSpaceResponseDto>;
  findAll(query: QueryConfigSpaceDto): Promise<PaginatedResponse<ConfigSpaceResponseDto>>;
  findOne(id: string): Promise<ConfigSpaceResponseDto>;
  findByName(name: string): Promise<ConfigSpaceResponseDto | null>;
  update(id: string, updateDto: UpdateConfigSpaceDto): Promise<ConfigSpaceResponseDto>;
  remove(id: string): Promise<void>;
  validateConfig(
    config: Record<string, any>,
    spaceId?: string,
  ): Promise<ValidateConfigResponseDto>;
  loadFromFile(filePath: string): Promise<ConfigSpaceJson>;
  getParameterNames(spaceId: string): Promise<string[]>;
  getParameterDefinition(
    spaceId: string,
    parameterName: string,
  ): Promise<ConfigSpaceJson[string] | null>;
}

