package com.example.StoryVerse;

import com.storyreview.StoryReviewApplication;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@ActiveProfiles("test")
@SpringBootTest(classes = StoryReviewApplication.class)
class StoryVerseApplicationTests {

	@Test
	void contextLoads() {
	}

}
