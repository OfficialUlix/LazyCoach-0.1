import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import { WorkaroundTextInput } from './WorkaroundTextInput';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  coachName: string;
  onSubmit: (rating: number, comment: string) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  coachName,
  onSubmit,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Comment Too Short', 'Please write at least 10 characters in your review.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(rating, comment.trim());
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (): void => {
    setRating(0);
    setComment('');
    onClose();
  };

  const renderStars = (): React.ReactElement[] => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          style={styles.starButton}
          onPress={() => setRating(i)}
        >
          <Text style={[
            styles.star,
            i <= rating ? styles.selectedStar : styles.unselectedStar
          ]}>
            ⭐
          </Text>
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Leave a Review</Text>
          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            <Text style={[
              styles.submitButton,
              (isSubmitting || rating === 0) && styles.submitButtonDisabled
            ]}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.coachSection}>
            <Text style={styles.coachLabel}>Review for</Text>
            <Text style={styles.coachName}>{coachName}</Text>
          </View>

          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>How was your session?</Text>
            <View style={styles.starsContainer}>
              {renderStars()}
            </View>
            <Text style={styles.ratingDescription}>
              {rating === 0 && 'Tap a star to rate'}
              {rating === 1 && 'Poor - Did not meet expectations'}
              {rating === 2 && 'Fair - Below expectations'}
              {rating === 3 && 'Good - Met expectations'}
              {rating === 4 && 'Very Good - Exceeded expectations'}
              {rating === 5 && 'Excellent - Outstanding experience'}
            </Text>
          </View>

          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>Share your experience</Text>
            <WorkaroundTextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Tell other users about your coaching session. What did you learn? How did the coach help you?"
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {comment.length}/500 characters
            </Text>
          </View>

          <View style={styles.guidelinesSection}>
            <Text style={styles.guidelinesTitle}>Review Guidelines</Text>
            <Text style={styles.guidelinesText}>
              • Be honest and constructive in your feedback{'\n'}
              • Focus on your coaching experience{'\n'}
              • Keep comments professional and respectful{'\n'}
              • Reviews help other users make informed decisions
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cancelButton: {
    color: '#666',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  submitButton: {
    color: '#0066CC',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonDisabled: {
    color: '#ccc',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  coachSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  coachLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  coachName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 32,
  },
  selectedStar: {
    opacity: 1,
  },
  unselectedStar: {
    opacity: 0.3,
  },
  ratingDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  commentSection: {
    marginBottom: 30,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#f8f9fa',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 8,
  },
  guidelinesSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});