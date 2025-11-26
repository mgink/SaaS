import { PartialType } from '@nestjs/mapped-types';
import { CreateStockFormDto } from './create-stock-form.dto';

export class UpdateStockFormDto extends PartialType(CreateStockFormDto) {}
