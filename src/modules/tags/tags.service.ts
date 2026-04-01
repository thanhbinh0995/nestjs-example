import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tag } from './tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagsService {
  constructor(@InjectRepository(Tag) private readonly tagRepository: Repository<Tag>) {}

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const existing = await this.tagRepository.findOne({ where: { name: createTagDto.name } });
    if (existing) {
      throw new ConflictException('Tag already exists');
    }
    const tag = this.tagRepository.create(createTagDto);
    return this.tagRepository.save(tag);
  }

  async findAll(): Promise<Tag[]> {
    return this.tagRepository.find({ order: { name: 'ASC' } });
  }

  async findPopular(limit = 10): Promise<Tag[]> {
    return this.tagRepository
      .createQueryBuilder('tag')
      .loadRelationCountAndMap('tag.postCount', 'tag.posts')
      .orderBy(`(SELECT COUNT(*) FROM post_tags pt WHERE pt."tagId" = tag."id")`, 'DESC')
      .take(limit)
      .getMany();
  }

  async findOne(id: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    return tag;
  }

  async findWithPosts(id: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: { id },
      relations: { posts: { author: true } },
    });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    return tag;
  }

  async delete(id: string): Promise<void> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    await this.tagRepository.delete(tag);
  }
}
